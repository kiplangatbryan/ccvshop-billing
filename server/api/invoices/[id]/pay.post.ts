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
    // For carpets (one per product), mark as out of stock when sold
    if (invoice.items && invoice.items.length > 0) {
      const { fetchCCVProducts } = await import('../../../utils/ccvShop')
      const products = await fetchCCVProducts()
      
      const stockUpdates = invoice.items.map(async (item, itemIndex) => {
        if (!item.productId) {
          log.warn('Item missing productId, skipping stock update', { item })
          return { 
            success: false, 
            reason: 'missing_product_id',
            status: 'failed' as const,
            itemIndex
          }
        }

        try {
          // First try to find in the fetched products list
          let product = products.find(p => p.id === String(item.productId))
          
          // If not found or stock not available, try fetching directly by ID
          if (!product || (product.stock === undefined && product.stock === null)) {
            const { fetchCCVProductById } = await import('../../../utils/ccvShop')
            const directProduct = await fetchCCVProductById(String(item.productId))
            
            if (directProduct) {
              product = directProduct
            }
          }
          
          if (!product) {
            log.warn('Product not found in CCV Shop', { 
              productId: item.productId,
              productName: item.productName 
            })
            return { 
              success: false, 
              reason: 'product_not_found', 
              productId: item.productId,
              status: 'failed' as const,
              itemIndex
            }
          }

          // Check if stock/quantity is available
          // CCV Shop may use 'stock', 'quantity', or stock tracking may be disabled
          const currentStock = product.stock ?? product.quantity
          
          if (currentStock === undefined || currentStock === null) {
            log.info('Product stock/quantity not available - marking as out of stock (set to 0)', { 
              productId: item.productId,
              productName: item.productName,
              hasStockField: product.stock !== undefined,
              hasQuantityField: product.quantity !== undefined
            })
            
            // For carpets (one per product), mark as out of stock when sold
            // Try to set stock to 0 to mark product as out of stock
            const updateResult = await updateCCVProductStock(item.productId, 0)
            
            if (updateResult) {
              log.info('Successfully marked product as out of stock in CCV Shop', {
                productId: item.productId,
                productName: item.productName
              })
              return { 
                success: true, 
                productId: item.productId,
                oldStock: undefined,
                newStock: 0,
                note: 'marked_out_of_stock',
                status: 'out_of_stock' as const,
                itemIndex
              }
            } else {
              log.warn('Failed to mark product as out of stock in CCV Shop', {
                productId: item.productId,
                productName: item.productName
              })
              return { 
                success: false, 
                productId: item.productId,
                note: 'stock_tracking_disabled_update_failed',
                status: 'not_tracked' as const,
                itemIndex
              }
            }
          }

          const quantityToReduce = item.quantity || 1
          const newStock = currentStock - quantityToReduce
          
          if (newStock < 0) {
            log.warn('Insufficient stock in CCV Shop', {
              productId: item.productId,
              productName: item.productName,
              currentStock: product.stock,
              requiredQuantity: quantityToReduce
            })
            return { 
              success: false, 
              reason: 'insufficient_stock',
              productId: item.productId,
              currentStock,
              requiredQuantity: quantityToReduce,
              status: 'insufficient_stock' as const,
              itemIndex
            }
          }

          const updateResult = await updateCCVProductStock(item.productId, newStock)
          
          if (updateResult) {
            log.info('Successfully updated product stock in CCV Shop', {
              productId: item.productId,
              productName: item.productName,
              oldStock: currentStock,
              newStock,
              quantityReduced: quantityToReduce
            })
            return { 
              success: true, 
              productId: item.productId,
              oldStock: currentStock,
              newStock,
              status: newStock === 0 ? 'out_of_stock' as const : 'updated' as const,
              itemIndex
            }
          } else {
            log.error('Failed to update product stock in CCV Shop', {
              productId: item.productId,
              productName: item.productName
            })
            return { 
              success: false, 
              reason: 'update_failed', 
              productId: item.productId,
              status: 'failed' as const,
              itemIndex
            }
          }
        } catch (error: any) {
          log.error('Error updating stock for product', {
            productId: item.productId,
            productName: item.productName,
            error: error.message || error
          })
          return { 
            success: false, 
            reason: 'error',
            productId: item.productId,
            error: error.message || String(error),
            status: 'failed' as const,
            itemIndex
          }
        }
      })

      const results = await Promise.all(stockUpdates)
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      log.info('Stock update results', {
        total: results.length,
        successful,
        failed,
        results: results.map(r => ({
          productId: r.productId,
          success: r.success,
          reason: r.reason,
          status: r.status
        }))
      })

      // Update invoice items with stock update status
      const updatedItems = invoice.items.map((item, index) => {
        const result = results.find((r: any) => r.itemIndex === index || r.productId === item.productId)
        if (result && result.status) {
          return {
            ...item,
            stockUpdateStatus: result.status,
            stockUpdateNote: result.note || result.reason || undefined
          }
        }
        return item
      })

      // Update invoice with stock update statuses
      await invoices.updateOne(
        { _id: objectId },
        { 
          $set: { 
            items: updatedItems,
            updatedAt: new Date()
          }
        }
      )

      // Log warning if some updates failed, but don't fail the payment
      if (failed > 0) {
        log.warn('Some stock updates failed, but invoice payment was processed', {
          failedCount: failed,
          failedItems: results.filter(r => !r.success)
        })
      }
    } else {
      log.info('No items in invoice, skipping stock update')
    }

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

