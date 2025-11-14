import { getCollection, toObjectId } from '../../utils/db'
import { updateCCVProductStock } from '../../utils/ccvShop'
import { recordOperation } from '../../utils/operationsLog'
import { logger } from '../../utils/logger'
import type { Invoice } from './index.get'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { invoiceIds } = body
    const user = event.context.user
    const log = logger.child({
      context: {
        route: '/api/invoices/bulk-pay',
        method: 'POST',
        userId: user?.userId
      }
    })

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid invoice IDs provided'
      })
    }

    const invoices = await getCollection<Invoice>('invoices')
    const objectIds = invoiceIds.map(id => toObjectId(id)).filter(Boolean)

    if (objectIds.length !== invoiceIds.length) {
      throw createError({
        statusCode: 400,
        message: 'Some invoice IDs are invalid'
      })
    }

    // Find invoices that belong to user and are not already paid
    const invoicesToUpdate = await invoices
      .find({
        _id: { $in: objectIds },
        createdBy: user.userId,
        status: { $ne: 'paid' }
      })
      .toArray()

    if (invoicesToUpdate.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'No invoices found to mark as paid'
      })
    }

    // Update all invoices to paid status
    const updateResult = await invoices.updateMany(
      { _id: { $in: invoicesToUpdate.map(inv => inv._id) } },
      {
        $set: {
          status: 'paid',
          updatedAt: new Date()
        }
      }
    )

    // Update product stock for all invoices
    const stockUpdates: Promise<boolean>[] = []
    for (const invoice of invoicesToUpdate) {
      for (const item of invoice.items) {
        try {
          const { fetchCCVProducts } = await import('../../utils/ccvShop')
          const products = await fetchCCVProducts()
          const product = products.find(p => p.id === item.productId)

          if (product && product.stock !== undefined) {
            const newStock = product.stock - item.quantity
            if (newStock >= 0) {
              stockUpdates.push(updateCCVProductStock(item.productId, newStock))
            } else {
              console.warn(`Insufficient stock for product ${item.productId}. Current: ${product.stock}, Required: ${item.quantity}`)
            }
          }
        } catch (error) {
          console.error(`Error updating stock for product ${item.productId}:`, error)
        }
      }
    }

    await Promise.all(stockUpdates)

    // Log operations
    for (const invoice of invoicesToUpdate) {
      await recordOperation({
        action: 'invoice:status-change',
        entityType: 'invoice',
        entityId: String(invoice._id),
        userId: user.userId,
        metadata: {
          status: 'paid',
          trigger: 'bulk-pay-endpoint'
        }
      })
    }

    log.info('Bulk marked invoices as paid', { count: invoicesToUpdate.length })

    return {
      success: true,
      message: `Successfully marked ${invoicesToUpdate.length} invoice(s) as paid`,
      count: invoicesToUpdate.length
    }
  } catch (error: any) {
    logger.error('Failed to bulk mark invoices as paid', {
      context: { route: '/api/invoices/bulk-pay', method: 'POST' },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to bulk mark invoices as paid'
    })
  }
})

