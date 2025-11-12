import { getCollection, toObjectId } from '../../utils/db'
import { logger } from '../../utils/logger'
import type { Invoice } from './index.get'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const user = event.context.user
    const objectId = toObjectId(id)
    const log = logger.child({
      context: {
        route: '/api/invoices/[id]',
        method: 'GET',
        userId: user?.userId,
        invoiceId: id
      }
    })

    if (!objectId) {
      log.warn('Attempted to fetch invoice with invalid id')
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
      log.warn('Invoice not found')
      throw createError({
        statusCode: 404,
        message: 'Invoice not found'
      })
    }
    
    log.debug('Fetched invoice')

    return {
      ...invoice,
      payments: invoice.payments ?? []
    }
  } catch (error: any) {
    logger.error('Failed to fetch invoice', {
      context: { route: '/api/invoices/[id]', method: 'GET', invoiceId: getRouterParam(event, 'id') },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch invoice'
    })
  }
})


