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
      items,
      tax = 0,
      status,
      currency = existingInvoice.currency || 'USD',
      invoiceDate = existingInvoice.invoiceDate,
      dueDate = existingInvoice.dueDate,
      terms = existingInvoice.terms,
      memo = existingInvoice.memo
    } = body

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const taxAmount = subtotal * (tax / 100)
    const total = subtotal + taxAmount

    const invoiceItems: InvoiceItem[] = items.map((item: any, index: number) => {
      const previous = existingInvoice.items[index]
      const sizeLabel = item.sizeLabel ?? item.size ?? previous?.sizeLabel
      const length = item.length ?? previous?.length
      const width = item.width ?? previous?.width
      const origin = item.origin ?? previous?.origin

      const payload: InvoiceItem = {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
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

      return payload
    })

    const updateData: Partial<Invoice> = {
      invoiceNumber,
      customerName,
      customerEmail,
      items: invoiceItems,
      subtotal,
      tax: taxAmount,
      total,
      currency,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : existingInvoice.invoiceDate,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      terms,
      memo,
      updatedAt: new Date()
    }

    const paymentsTotal = (existingInvoice.payments ?? []).reduce((sum, record) => sum + record.amount, 0)

    if (status) {
      updateData.status = status
    } else if (paymentsTotal > 0) {
      updateData.status = paymentsTotal >= total ? 'paid' : 'partial'
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
        subtotal,
        total
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


