import { getCollection } from '../../utils/db'
import { logger } from '../../utils/logger'
import { recordOperation } from '../../utils/operationsLog'
import type { Invoice, InvoiceItem, PaymentRecord } from './index.get'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const user = event.context.user
    const log = logger.child({
      context: {
        route: '/api/invoices',
        method: 'POST',
        userId: user?.userId
      }
    })
    
    const {
      invoiceNumber,
      customerName,
      customerEmail,
      items,
      tax = 0,
      carpetDefaults,
      initialPayment,
      currency = 'USD',
      invoiceDate,
      dueDate,
      terms,
      memo,
      discount = 0,
      discountType = 'amount',
      discountAmount: discountAmountInput
    } = body

    if (!invoiceNumber || !customerName || !customerEmail || !items || items.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    const lineTotals = items.map((item: any) => Number(item.total ?? item.price * item.quantity) || 0)
    const subtotal = lineTotals.reduce((sum: number, total) => sum + total, 0)

    let discountAmount = Number(discountAmountInput)
    if (!(discountAmount >= 0)) {
      const discountValue = Number(discount) || 0
      if (discountType === 'percent') {
        discountAmount = Math.min(subtotal, (subtotal * discountValue) / 100)
      } else {
        discountAmount = Math.min(subtotal, discountValue)
      }
    }

    discountAmount = Math.max(discountAmount, 0)
    const taxableBase = Math.max(subtotal - discountAmount, 0)
    const taxAmount = taxableBase * (tax / 100)
    const total = taxableBase + taxAmount

    const invoiceItems: InvoiceItem[] = items.map((item: any, index: number) => {
      const sizeLabel = item.sizeLabel ?? item.size ?? carpetDefaults?.sizeLabel
      const length = item.length ?? carpetDefaults?.length
      const width = item.width ?? carpetDefaults?.width
      const origin = item.origin ?? carpetDefaults?.origin

      const payload: InvoiceItem = {
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        total: Number(item.total ?? item.price * item.quantity) || 0
      }

      if (item.description) {
        payload.description = item.description
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

      const areaFromPayload =
        typeof item.area === 'number'
          ? item.area
          : payload.length !== undefined && payload.width !== undefined
              ? Number(payload.length) * Number(payload.width)
              : undefined

      if (areaFromPayload !== undefined) {
        payload.area = Number(areaFromPayload)
      }

      if (origin) {
        payload.origin = origin
      }

      return payload
    })

    const payments: PaymentRecord[] = []

    if (initialPayment?.amount) {
      const supportedMethods: PaymentRecord['method'][] = ['bank_transfer', 'cash', 'card', 'cheque', 'other']
      const methodCandidate = initialPayment.method as PaymentRecord['method'] | undefined
      const method = methodCandidate && supportedMethods.includes(methodCandidate)
        ? methodCandidate
        : 'other'

      payments.push({
        method,
        amount: Number(initialPayment.amount),
        reference: initialPayment.reference || undefined,
        notes: initialPayment.notes || undefined,
        paidAt: initialPayment.paidAt ? new Date(initialPayment.paidAt) : new Date(),
        recordedBy: user.userId
      })
    }

    const invoice: Invoice = {
      invoiceNumber,
      customerName,
      customerEmail,
      items: invoiceItems,
      subtotal,
      tax: taxAmount,
      total,
      taxRate: Number(tax) || 0,
      status: payments.length > 0 ? (payments[0].amount >= total ? 'paid' : 'partial') : 'draft',
      payments,
      currency,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      terms: terms || undefined,
      memo: memo || undefined,
      discountAmount,
      discountType,
      discount: Number(discount) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.userId
    }

    const invoices = await getCollection<Invoice>('invoices')
    const result = await invoices.insertOne(invoice)

    log.info('Created invoice', {
      invoiceId: result.insertedId.toString(),
      invoiceNumber,
      total
    })

    await recordOperation({
      action: 'invoice:create',
      entityType: 'invoice',
      entityId: result.insertedId.toString(),
      userId: user.userId,
      metadata: {
        invoiceNumber,
        total,
        items: invoiceItems.length,
        paymentApplied: payments.length > 0
      }
    })

    return {
      success: true,
      invoice: { ...invoice, _id: result.insertedId.toString() }
    }
  } catch (error: any) {
    logger.error('Failed to create invoice', {
      context: { route: '/api/invoices', method: 'POST' },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create invoice'
    })
  }
})


