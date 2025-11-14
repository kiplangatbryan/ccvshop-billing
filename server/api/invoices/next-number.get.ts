import { getCollection } from '../../utils/db'
import { logger } from '../../utils/logger'
import type { Invoice } from './index.get'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    const log = logger.child({
      context: {
        route: '/api/invoices/next-number',
        method: 'GET',
        userId: user?.userId
      }
    })
    
    const invoices = await getCollection<Invoice>('invoices')
    
    // Get all invoices for this user
    const allInvoices = await invoices
      .find({ createdBy: user.userId })
      .toArray()
    
    let maxNumber = 0
    for (const invoice of allInvoices) {
      if (invoice.invoiceNumber) {
        // Extract number from invoice number (e.g., "INV-000123" -> 123)
        const match = invoice.invoiceNumber.match(/(\d+)$/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxNumber) {
            maxNumber = num
          }
        }
      }
    }
    
    // Next number is max + 1, or 1 if no invoices exist
    const nextNumber = maxNumber + 1
    
    // Format with prefix and padding
    const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`
    
    log.debug('Generated next invoice number', { invoiceNumber, nextNumber })
    
    return {
      invoiceNumber
    }
  } catch (error: any) {
    logger.error('Failed to get next invoice number', {
      context: { route: '/api/invoices/next-number', method: 'GET' },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to get next invoice number'
    })
  }
})

