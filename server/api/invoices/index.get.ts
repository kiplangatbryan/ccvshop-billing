import { getCollection } from '../../utils/db'
import { logger } from '../../utils/logger'
import type { ObjectId } from 'mongodb'

export interface Invoice {
  _id?: string | ObjectId
  invoiceNumber: string
  customerName: string
  customerEmail: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled'
  payments: PaymentRecord[]
  currency?: string
  invoiceDate?: Date
  dueDate?: Date
  terms?: string
  memo?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
  sizeLabel?: string
  length?: number
  width?: number
  origin?: string
}

export interface PaymentRecord {
  _id?: string
  method: 'bank_transfer' | 'cash' | 'card' | 'cheque' | 'other'
  amount: number
  reference?: string
  notes?: string
  paidAt: Date
  recordedBy: string
}

export default defineEventHandler(async (event) => {
  try {
    const invoices = await getCollection<Invoice>('invoices')
    const user = event.context.user
    const log = logger.child({
      context: {
        route: '/api/invoices',
        method: 'GET',
        userId: user?.userId
      }
    })
    
    const invoiceList = await invoices
      .find({ createdBy: user.userId })
      .sort({ createdAt: -1 })
      .toArray()
    
    log.debug('Fetched invoices', { count: invoiceList.length })

    return invoiceList.map((invoice) => ({
      ...invoice,
      payments: invoice.payments ?? []
    }))
  } catch (error: any) {
    logger.error('Failed to fetch invoices', {
      context: { route: '/api/invoices', method: 'GET' },
      error
    })
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch invoices'
    })
  }
})


