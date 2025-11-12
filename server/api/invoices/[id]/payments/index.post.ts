import { getCollection, toObjectId } from '../../../../utils/db'
import { recordOperation } from '../../../../utils/operationsLog'
import { logger } from '../../../../utils/logger'
import type { Invoice, PaymentRecord } from '../../index.get'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const user = event.context.user

    const objectId = toObjectId(id)
    const log = logger.child({
      context: {
        route: '/api/invoices/[id]/payments',
        method: 'POST',
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

    const {
      amount,
      method = 'other',
      reference,
      notes,
      paidAt
    } = body || {}

    const numericAmount = Number(amount)

    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Payment amount must be greater than zero'
      })
    }

    const supportedMethods: PaymentRecord['method'][] = ['bank_transfer', 'cash', 'card', 'cheque', 'other']
    const methodCandidate = method as PaymentRecord['method']
    const paymentMethod = supportedMethods.includes(methodCandidate) ? methodCandidate : 'other'

    const invoices = await getCollection<Invoice>('invoices')
    const invoice = await invoices.findOne({ _id: objectId, createdBy: user.userId })

    if (!invoice) {
      log.warn('Invoice not found when recording payment')
      throw createError({
        statusCode: 404,
        message: 'Invoice not found'
      })
    }

    const payment: PaymentRecord = {
      method: paymentMethod,
      amount: numericAmount,
      reference: reference || undefined,
      notes: notes || undefined,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      recordedBy: user.userId
    }

    const existingTotal = (invoice.payments ?? []).reduce((sum, record) => sum + record.amount, 0)
    const updatedTotal = existingTotal + payment.amount

    const nextStatus =
      updatedTotal >= invoice.total ? 'paid'
      : updatedTotal > 0 ? 'partial'
      : invoice.status === 'draft' ? 'sent' : invoice.status

    await invoices.updateOne(
      { _id: objectId },
      {
        $push: { payments: payment },
        $set: {
          status: nextStatus,
          updatedAt: new Date()
        }
      }
    )

    const updatedInvoice = await invoices.findOne({ _id: objectId })
    log.info('Recorded invoice payment', {
      amount: payment.amount,
      method: payment.method,
      status: nextStatus
    })

    await recordOperation({
      action: 'invoice:payment-recorded',
      entityType: 'payment',
      entityId: `${id}:${payment.paidAt.getTime()}`,
      userId: user.userId,
      metadata: {
        invoiceId: id,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        status: nextStatus
      }
    })

    return {
      success: true,
      invoice: updatedInvoice
    }
  } catch (error: any) {
    logger.error('Failed to record invoice payment', {
      context: { route: '/api/invoices/[id]/payments', method: 'POST', invoiceId: getRouterParam(event, 'id') },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to record payment'
    })
  }
})


