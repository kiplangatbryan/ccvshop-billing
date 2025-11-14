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
    const objectIds = invoiceIds.map(id => toObjectId(id)).filter((id): id is NonNullable<typeof id> => id !== null)

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
    // First, aggregate quantities by product to handle same product in multiple invoices
    const productQuantities = new Map<string, number>()
    for (const invoice of invoicesToUpdate) {
      for (const item of invoice.items) {
        if (item.productId) {
          const currentQty = productQuantities.get(String(item.productId)) || 0
          productQuantities.set(String(item.productId), currentQty + (item.quantity || 1))
        }
      }
    }

    // Fetch products once
    const { fetchCCVProducts } = await import('../../utils/ccvShop')
    const products = await fetchCCVProducts()

    // Update stock for each unique product
    const stockUpdates = Array.from(productQuantities.entries()).map(async ([productId, totalQuantity]) => {
      try {
        const product = products.find(p => p.id === productId)

        if (!product) {
          log.warn('Product not found in CCV Shop for bulk update', { productId })
          return { success: false, reason: 'product_not_found', productId }
        }

        const currentStock = product.stock ?? product.quantity
        
        // If stock tracking is disabled, mark as out of stock (set to 0)
        if (currentStock === undefined || currentStock === null) {
          log.info('Product stock not available - marking as out of stock (set to 0) for bulk update', { productId })
          const updateResult = await updateCCVProductStock(productId, 0)
          
          if (updateResult) {
            log.info('Successfully marked product as out of stock in CCV Shop (bulk)', { productId })
            return {
              success: true,
              productId,
              oldStock: undefined,
              newStock: 0,
              note: 'marked_out_of_stock'
            }
          } else {
            return { success: false, reason: 'stock_not_available', productId }
          }
        }

        const newStock = currentStock - totalQuantity

        if (newStock < 0) {
          log.warn('Insufficient stock in CCV Shop for bulk update', {
            productId,
            currentStock,
            requiredQuantity: totalQuantity
          })
          return {
            success: false,
            reason: 'insufficient_stock',
            productId,
            currentStock,
            requiredQuantity: totalQuantity
          }
        }

        const updateResult = await updateCCVProductStock(productId, newStock)

        if (updateResult) {
          log.info('Successfully updated product stock in CCV Shop (bulk)', {
            productId,
            oldStock: currentStock,
            newStock,
            quantityReduced: totalQuantity
          })
          return {
            success: true,
            productId,
            oldStock: currentStock,
            newStock
          }
        } else {
          log.error('Failed to update product stock in CCV Shop (bulk)', { productId })
          return { success: false, reason: 'update_failed', productId }
        }
      } catch (error: any) {
        log.error('Error updating stock for product (bulk)', {
          productId,
          error: error.message || error
        })
        return {
          success: false,
          reason: 'error',
          productId,
          error: error.message || String(error)
        }
      }
    })

    const results = await Promise.all(stockUpdates)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    log.info('Bulk stock update results', {
      total: results.length,
      successful,
      failed,
      results: results.map(r => ({
        productId: r.productId,
        success: r.success,
        reason: r.reason
      }))
    })

    if (failed > 0) {
      log.warn('Some stock updates failed during bulk payment, but invoices were marked as paid', {
        failedCount: failed,
        failedItems: results.filter(r => !r.success)
      })
    }

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

