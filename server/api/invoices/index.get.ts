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
  discountAmount?: number
  discountType?: 'amount' | 'percent'
  discount?: number
  taxRate?: number
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
  description?: string
  sizeLabel?: string
  length?: number
  width?: number
  area?: number
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
    const query = getQuery(event)
    const log = logger.child({
      context: {
        route: '/api/invoices',
        method: 'GET',
        userId: user?.userId
      }
    })
    
    // Build filter query
    const filter: any = { createdBy: user.userId }
    const andConditions: any[] = []
    
    // Search filter
    if (query.search && typeof query.search === 'string' && query.search.trim()) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' }
      andConditions.push({
        $or: [
          { invoiceNumber: searchRegex },
          { customerName: searchRegex },
          { customerEmail: searchRegex },
          { memo: searchRegex }
        ]
      })
    }
    
    // Status filter
    if (query.status && typeof query.status === 'string' && query.status !== 'all') {
      filter.status = query.status
    }
    
    // Date range filters - check both invoiceDate and createdAt
    if (query.dateFrom && typeof query.dateFrom === 'string') {
      const dateFrom = new Date(query.dateFrom)
      andConditions.push({
        $or: [
          { invoiceDate: { $gte: dateFrom } },
          { $and: [{ $or: [{ invoiceDate: { $exists: false } }, { invoiceDate: null }] }, { createdAt: { $gte: dateFrom } }] }
        ]
      })
    }
    if (query.dateTo && typeof query.dateTo === 'string') {
      const dateTo = new Date(query.dateTo)
      andConditions.push({
        $or: [
          { invoiceDate: { $lte: dateTo } },
          { $and: [{ $or: [{ invoiceDate: { $exists: false } }, { invoiceDate: null }] }, { createdAt: { $lte: dateTo } }] }
        ]
      })
    }
    
    // Combine all conditions
    if (andConditions.length > 0) {
      filter.$and = andConditions
    }
    
    // Sorting
    const sortBy = query.sortBy && typeof query.sortBy === 'string' ? query.sortBy : 'createdAt'
    const sortOrder = query.sortOrder && typeof query.sortOrder === 'string' ? query.sortOrder : 'desc'
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    
    // Map sortBy to actual field names
    const sortFieldMap: Record<string, string> = {
      invoiceNumber: 'invoiceNumber',
      customerName: 'customerName',
      invoiceDate: 'invoiceDate',
      dueDate: 'dueDate',
      total: 'total',
      status: 'status',
      createdAt: 'createdAt'
    }
    const sortField = sortFieldMap[sortBy] || 'createdAt'
    const sort: any = { [sortField]: sortDirection }
    
    // Pagination
    const page = query.page ? parseInt(query.page as string) : 1
    const itemsPerPage = query.itemsPerPage ? parseInt(query.itemsPerPage as string) : 10
    const skip = (page - 1) * itemsPerPage
    
    // Get total count for pagination
    const total = await invoices.countDocuments(filter)
    
    // Fetch invoices with pagination
    const invoiceList = await invoices
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(itemsPerPage)
      .toArray()
    
    log.debug('Fetched invoices', { count: invoiceList.length, total, page, itemsPerPage })

    return {
      items: invoiceList.map((invoice) => ({
        ...invoice,
        payments: invoice.payments ?? []
      })),
      total,
      page,
      itemsPerPage,
      totalPages: Math.ceil(total / itemsPerPage)
    }
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


