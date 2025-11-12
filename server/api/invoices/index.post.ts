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
      memo
    } = body

    if (!invoiceNumber || !customerName || !customerEmail || !items || items.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const taxAmount = subtotal * (tax / 100)
    const total = subtotal + taxAmount

    const invoiceItems: InvoiceItem[] = items.map((item: any, index: number) => {
      const sizeLabel = item.sizeLabel ?? item.size ?? carpetDefaults?.sizeLabel
      const length = item.length ?? carpetDefaults?.length
      const width = item.width ?? carpetDefaults?.width
      const origin = item.origin ?? carpetDefaults?.origin

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
      status: payments.length > 0 ? (payments[0].amount >= total ? 'paid' : 'partial') : 'draft',
      payments,
      currency,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      terms: terms || undefined,
      memo: memo || undefined,
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


