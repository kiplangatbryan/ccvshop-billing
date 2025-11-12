import { getCollection, toObjectId } from '../../utils/db'
import { recordOperation } from '../../utils/operationsLog'
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
        method: 'DELETE',
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
    
    const result = await invoices.deleteOne({ 
      _id: objectId,
      createdBy: user.userId
    })
    
    if (result.deletedCount === 0) {
      log.warn('Attempted to delete non-existent invoice')
      throw createError({
        statusCode: 404,
        message: 'Invoice not found'
      })
    }

    log.info('Deleted invoice')

    await recordOperation({
      action: 'invoice:delete',
      entityType: 'invoice',
      entityId: id!,
      userId: user.userId
    })
    
    return { success: true, message: 'Invoice deleted successfully' }
  } catch (error: any) {
    logger.error('Failed to delete invoice', {
      context: { route: '/api/invoices/[id]', method: 'DELETE', invoiceId: getRouterParam(event, 'id') },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete invoice'
    })
  }
})


