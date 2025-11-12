import { getCollection, toObjectId } from '../../../utils/db'
import type { Invoice } from '../index.get'
import { getCompanySettings } from '../../../utils/companySettings'
import { buildInvoicePdf } from '../../../utils/pdf'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const user = event.context.user
    const objectId = toObjectId(id)

    if (!objectId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid invoice id'
      })
    }
    
    const invoices = await getCollection<Invoice>('invoices')
    const invoice = await invoices.findOne({ 
      _id: objectId,
      createdBy: user.userId
    })
    
    if (!invoice) {
      throw createError({
        statusCode: 404,
        message: 'Invoice not found'
      })
    }

    const company = await getCompanySettings()
    const pdfBuffer = await buildInvoicePdf(invoice, company)

    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`)
    return pdfBuffer
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate PDF'
    })
  }
})

