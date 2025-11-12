import { getCollection, toObjectId } from '../../utils/db'
import { recordOperation } from '../../utils/operationsLog'
import { logger } from '../../utils/logger'
import type { Invoice, InvoiceItem } from './index.get'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const user = event.context.user
    const objectId = toObjectId(id)
    const log = logger.child({
      context: {
        route: '/api/invoices/[id]',
        method: 'PUT',
        userId: user?.userId,
        invoiceId: id
      }
    })

    if (!objectId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid invoice id'
      })
    }
    
    const invoices = await getCollection<Invoice>('invoices')
    
    // Check if invoice exists and belongs to user
    const existingInvoice = await invoices.findOne({
      _id: objectId,
      createdBy: user.userId
    } as any)
    
    if (!existingInvoice) {
      log.warn('Invoice not found for update')
      throw createError({
        statusCode: 404,
        message: 'Invoice not found'
      })
    }

    const {
      invoiceNumber,
      customerName,
      customerEmail,
      items = [],
      taxRate: incomingTaxRate,
      tax: legacyTax,
      status,
      currency = existingInvoice.currency || 'USD',
      invoiceDate = existingInvoice.invoiceDate,
      dueDate = existingInvoice.dueDate,
      terms = existingInvoice.terms,
      memo = existingInvoice.memo,
      discount = existingInvoice.discount ?? 0,
      discountType = existingInvoice.discountType ?? 'amount',
      discountAmount: providedDiscountAmount
    } = body

    if (!Array.isArray(items) || items.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Invoice must include at least one item'
      })
    }

    const resolvedTaxRate = typeof incomingTaxRate === 'number'
      ? incomingTaxRate
      : typeof legacyTax === 'number'
        ? legacyTax
        : existingInvoice.taxRate ?? 0

    const invoiceItems: InvoiceItem[] = items.map((item: any, index: number) => {
      const previous = existingInvoice.items[index]
      const sizeLabel = item.sizeLabel ?? item.size ?? previous?.sizeLabel
      const length = item.length !== undefined ? item.length : previous?.length
      const width = item.width !== undefined ? item.width : previous?.width
      const origin = item.origin ?? previous?.origin

      const quantityRaw = item.quantity !== undefined ? item.quantity : previous?.quantity ?? 0
      const priceRaw = item.price !== undefined ? item.price : previous?.price ?? 0
      const description = item.description ?? previous?.description

      const quantity = Number(quantityRaw) > 0 ? Number(quantityRaw) : 0
      const price = Number(priceRaw) || 0

      let area: number | undefined
      if (item.area !== undefined && item.area !== null) {
        const parsedArea = Number(item.area)
        area = Number.isFinite(parsedArea) && parsedArea > 0 ? Number(parsedArea.toFixed(2)) : undefined
      } else if (length !== undefined && length !== null && width !== undefined && width !== null) {
        const numericLength = Number(length) || 0
        const numericWidth = Number(width) || 0
        const computedArea = numericLength * numericWidth
        area = computedArea > 0 ? Number(computedArea.toFixed(2)) : undefined
      } else if (previous?.area) {
        area = Number(previous.area.toFixed(2))
      }

      const lineTotalBase = area && area > 0 ? area * price : price * (quantity || 0)
      const total = Number.isFinite(lineTotalBase) ? Number(lineTotalBase.toFixed(2)) : 0

      const payload: InvoiceItem = {
        productId: item.productId,
        productName: item.productName,
        quantity: quantity || (area && area > 0 ? 1 : 0),
        price,
        total
      }

      if (sizeLabel) {
        payload.sizeLabel = sizeLabel
      }
      if (length !== undefined && length !== null) {
        payload.length = Number(length)
      }
      if (width !== undefined && width !== null) {
        payload.width = Number(width)
      }
      if (origin) {
        payload.origin = origin
      }
      if (area && area > 0) {
        payload.area = area
      }
      if (description) {
        payload.description = description
      }

      return payload
    })

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)

    const calculatedDiscountAmount = (() => {
      if (typeof providedDiscountAmount === 'number') {
        return Math.min(subtotal, Math.max(providedDiscountAmount, 0))
      }
      if (discountType === 'percent') {
        const percentDiscount = subtotal * ((discount || 0) / 100)
        return Math.min(subtotal, Math.max(percentDiscount, 0))
      }
      return Math.min(subtotal, Math.max(discount || 0, 0))
    })()

    const taxableBase = Math.max(subtotal - calculatedDiscountAmount, 0)
    const taxAmount = taxableBase * ((resolvedTaxRate || 0) / 100)
    const total = taxableBase + taxAmount

    const updateData: Partial<Invoice> = {
      invoiceNumber,
      customerName,
      customerEmail,
      items: invoiceItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(calculatedDiscountAmount.toFixed(2)),
      discount: Number(discount || 0),
      discountType,
      tax: Number(taxAmount.toFixed(2)),
      taxRate: Number((resolvedTaxRate || 0).toFixed(2)),
      total: Number(total.toFixed(2)),
      currency,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : existingInvoice.invoiceDate,
      dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
      terms,
      memo,
      updatedAt: new Date()
    }

    const paymentsTotal = (existingInvoice.payments ?? []).reduce((sum, record) => sum + record.amount, 0)

    if (status) {
      updateData.status = status
    } else if (paymentsTotal > 0) {
      updateData.status = paymentsTotal >= total ? 'paid' : 'partial'
    } else {
      updateData.status = existingInvoice.status
    }

    await invoices.updateOne(
      { _id: objectId } as any,
      { $set: updateData }
    )

    const updatedInvoice = await invoices.findOne({ _id: objectId } as any)
    const normalizedInvoice = updatedInvoice
      ? { ...updatedInvoice, payments: updatedInvoice.payments ?? [] }
      : updatedInvoice

    log.info('Updated invoice', {
      total,
      status: normalizedInvoice?.status
    })

    await recordOperation({
      action: 'invoice:update',
      entityType: 'invoice',
      entityId: id!,
      userId: user.userId,
      metadata: {
        invoiceNumber,
        status: normalizedInvoice?.status,
        items: invoiceItems.length,
        subtotal: updateData.subtotal,
        total: updateData.total
      }
    })

    return {
      success: true,
      invoice: normalizedInvoice
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update invoice'
    })
  }
})


