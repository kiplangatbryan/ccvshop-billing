import { getCollection, toObjectId } from '../../../utils/db'
import type { Invoice } from '../index.get'
import { sendEmail } from '../../../utils/email'
import { generateInvoiceHtml, generateInvoiceText } from '../../../utils/invoiceTemplate'
import { recordOperation } from '../../../utils/operationsLog'
import { logger } from '../../../utils/logger'
import { getCompanySettings } from '../../../utils/companySettings'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const user = event.context.user
    const objectId = toObjectId(id)
    const config = useRuntimeConfig()

    const log = logger.child({
      context: {
        route: '/api/invoices/[id]/email',
        method: 'POST',
        invoiceId: id,
        userId: user?.userId
      }
    })

    if (!objectId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid invoice id'
      })
    }

    const invoices = await getCollection<Invoice>('invoices')
    const invoice = await invoices.findOne({ _id: objectId, createdBy: user.userId } as any)

    if (!invoice) {
      throw createError({
        statusCode: 404,
        message: 'Invoice not found'
      })
    }

    if (!config.smtpHost) {
      throw createError({
        statusCode: 500,
        message: 'Email service is not configured. Please add SMTP settings.'
      })
    }

    const companySettings = await getCompanySettings()
    const companyInfo = {
      name: companySettings.name || 'Zargar Invoice',
      email: config.smtpFromEmail || companySettings.email,
      logoUrl: companySettings.logoUrl,
      address: companySettings.address,
      phone: companySettings.phone,
      website: companySettings.website
    }

    const html = generateInvoiceHtml(invoice, companyInfo)
    const text = generateInvoiceText(invoice, companyInfo)

    const emailTo = body?.to || invoice.customerEmail
    const subject = body?.subject || `Invoice ${invoice.invoiceNumber}`
    const message = body?.message || 'Please find your invoice attached.'

    await sendEmail({
      to: emailTo,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; background-color:#f8fafc; padding:24px;">
          <div style="background:white;border-radius:16px;padding:32px;max-width:640px;margin:0 auto;">
            <p style="margin-bottom:16px;">${message}</p>
            <div style="margin-top:24px;">${html}</div>
          </div>
        </div>
      `,
      text: `${message}\n\n${text}`,
      attachments: body?.includeHtmlAttachment
        ? [
            {
              filename: `invoice-${invoice.invoiceNumber}.html`,
              content: html,
              contentType: 'text/html'
            }
          ]
        : undefined
    })

    log.info('Invoice email sent', { metadata: { to: emailTo } })

    await recordOperation({
      action: 'invoice:email-sent',
      entityType: 'invoice',
      entityId: id!,
      userId: user.userId,
      metadata: {
        to: emailTo,
        subject,
        includeHtmlAttachment: Boolean(body?.includeHtmlAttachment)
      }
    })

    return {
      success: true,
      message: 'Invoice email sent'
    }
  } catch (error: any) {
    logger.error('Failed to send invoice email', {
      context: { route: '/api/invoices/[id]/email', method: 'POST', invoiceId: getRouterParam(event, 'id') },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to send invoice email'
    })
  }
})


