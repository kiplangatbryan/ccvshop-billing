import type { Invoice } from './index.get'
import { getCompanySettings } from '../../utils/companySettings'
import { buildInvoicePdf } from '../../utils/pdf'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const payload = body?.invoice

  if (!payload) {
    throw createError({
      statusCode: 400,
      message: 'Invoice payload is required.'
    })
  }

  const items = Array.isArray(payload.items)
    ? payload.items.map((item: any) => {
        const quantity = Number(item.quantity) || 0
        const price = Number(item.price) || 0
        const total = typeof item.total === 'number' ? item.total : quantity * price
        const area =
          typeof item.area === 'number'
            ? item.area
            : item.length && item.width
              ? Number(item.length) * Number(item.width)
              : undefined

        return {
          productId: item.productId,
          productName: item.productName || 'Item',
          quantity,
          price,
          total,
          description: item.description,
          sizeLabel: item.sizeLabel,
          length: item.length ?? undefined,
          width: item.width ?? undefined,
          area,
          origin: item.origin
        }
      })
    : []

  const payments = Array.isArray(payload.payments)
    ? payload.payments.map((payment: any) => ({
        method: payment.method || 'other',
        amount: Number(payment.amount) || 0,
        reference: payment.reference,
        notes: payment.notes,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : new Date(),
        recordedBy: payment.recordedBy || 'preview'
      }))
    : []

  const subtotal = Number(payload.subtotal) || items.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = Number(payload.discountAmount) || 0
  const taxAmount = Number(payload.tax) || 0
  const total =
    typeof payload.total === 'number'
      ? Number(payload.total)
      : Math.max(subtotal - discountAmount, 0) + taxAmount

  const invoice: Invoice = {
    invoiceNumber: payload.invoiceNumber || 'INV-XXXXXX',
    customerName: payload.customerName || 'Client Name',
    customerEmail: payload.customerEmail || 'client@email.com',
    items,
    subtotal,
    tax: taxAmount,
    total,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
    discountType: payload.discountType,
    discount: Number(payload.discount) || 0,
    taxRate: Number(payload.taxRate) || 0,
    status: payload.status || 'draft',
    payments,
    currency: payload.currency || 'USD',
    invoiceDate: payload.invoiceDate ? new Date(payload.invoiceDate) : new Date(),
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    terms: payload.terms,
    memo: payload.memo,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: payload.createdBy || 'preview'
  }

  const company = await getCompanySettings()
  const pdfBuffer = await buildInvoicePdf(invoice, company)

  setHeader(event, 'Content-Type', 'application/pdf')
  return pdfBuffer
})
