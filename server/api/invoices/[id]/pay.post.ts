import { getCollection, toObjectId } from '../../../utils/db'
import { updateCCVProductStock } from '../../../utils/ccvShop'
import { recordOperation } from '../../../utils/operationsLog'
import { logger } from '../../../utils/logger'
import type { Invoice } from '../index.get'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const user = event.context.user
    const objectId = toObjectId(id)
    const log = logger.child({
      context: {
        route: '/api/invoices/[id]/pay',
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
    
    const invoices = await getCollection<Invoice>('invoices')
    
    // Check if invoice exists and belongs to user
    const invoice = await invoices.findOne({ 
      _id: objectId,
      createdBy: user.userId
    })
    
    if (!invoice) {
      log.warn('Invoice not found for payment')
      throw createError({
        statusCode: 404,
        message: 'Invoice not found'
      })
    }

    if (invoice.status === 'paid') {
      throw createError({
        statusCode: 400,
        message: 'Invoice is already paid'
      })
    }

    // Update invoice status to paid
    await invoices.updateOne(
      { _id: objectId },
      { 
        $set: { 
          status: 'paid',
          updatedAt: new Date()
        }
      }
    )

    // Update product stock in CCV Shop for each item
    // Reduce stock by the quantity sold for each product
    const stockUpdates = invoice.items.map(async (item) => {
      try {
        // Fetch current product to get stock
        const { fetchCCVProducts } = await import('../../../utils/ccvShop')
        const products = await fetchCCVProducts()
        const product = products.find(p => p.id === item.productId)
        
        if (product && product.stock !== undefined) {
          const newStock = product.stock - item.quantity
          if (newStock >= 0) {
            return updateCCVProductStock(item.productId, newStock)
          } else {
            console.warn(`Insufficient stock for product ${item.productId}. Current: ${product.stock}, Required: ${item.quantity}`)
            return false
          }
        } else {
          // If stock info not available, log warning but don't update
          console.warn(`Stock info not available for product ${item.productId}, skipping stock update`)
          return false
        }
      } catch (error) {
        console.error(`Error updating stock for product ${item.productId}:`, error)
        return false
      }
    })

    await Promise.all(stockUpdates)

    const updatedInvoice = await invoices.findOne({ _id: objectId })
    log.info('Invoice marked as paid via pay endpoint')

    await recordOperation({
      action: 'invoice:status-change',
      entityType: 'invoice',
      entityId: id!,
      userId: user.userId,
      metadata: {
        status: 'paid',
        trigger: 'pay-endpoint'
      }
    })
    
    return {
      success: true,
      message: 'Invoice marked as paid and inventory updated',
      invoice: updatedInvoice
    }
  } catch (error: any) {
    logger.error('Failed to process invoice payment', {
      context: { route: '/api/invoices/[id]/pay', method: 'POST', invoiceId: getRouterParam(event, 'id') },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to process payment'
    })
  }
})

