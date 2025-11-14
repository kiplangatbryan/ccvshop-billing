import { getCollection } from '../../utils/db'
import { logger } from '../../utils/logger'
import type { Invoice } from '../invoices/index.get'

export default defineEventHandler(async (event) => {
  try {
    const invoices = await getCollection<Invoice>('invoices')
    const user = event.context.user
    const log = logger.child({
      context: {
        route: '/api/dashboard/stats',
        method: 'GET',
        userId: user?.userId
      }
    })

    // Get all invoices for the user
    const allInvoices = await invoices
      .find({ createdBy: user.userId })
      .toArray()

    // Calculate basic stats
    const totalInvoices = allInvoices.length
    const totalRevenue = allInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0)
    
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid').length
    const pendingInvoices = allInvoices.filter(inv => inv.status === 'sent' || inv.status === 'partial').length
    const draftInvoices = allInvoices.filter(inv => inv.status === 'draft').length
    const cancelledInvoices = allInvoices.filter(inv => inv.status === 'cancelled').length

    // Calculate pending revenue (unpaid invoices)
    const pendingRevenue = allInvoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.total || 0), 0)

    // Calculate monthly revenue for the last 6 months
    const monthlyRevenue: Record<string, number> = {}
    const monthlyCount: Record<string, number> = {}
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyRevenue[monthKey] = 0
      monthlyCount[monthKey] = 0
    }

    allInvoices
      .filter(inv => inv.status === 'paid')
      .forEach(inv => {
        const invoiceDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(inv.createdAt)
        const monthKey = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyRevenue[monthKey] !== undefined) {
          monthlyRevenue[monthKey] += inv.total || 0
          monthlyCount[monthKey] += 1
        }
      })

    // Calculate status distribution
    const statusDistribution = {
      paid: paidInvoices,
      pending: pendingInvoices,
      draft: draftInvoices,
      cancelled: cancelledInvoices
    }

    // Calculate revenue by status
    const revenueByStatus = {
      paid: totalRevenue,
      pending: pendingRevenue,
      draft: allInvoices
        .filter(inv => inv.status === 'draft')
        .reduce((sum, inv) => sum + (inv.total || 0), 0),
      cancelled: allInvoices
        .filter(inv => inv.status === 'cancelled')
        .reduce((sum, inv) => sum + (inv.total || 0), 0)
    }

    // Get recent invoices (last 10)
    const recentInvoices = allInvoices
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 10)
      .map(inv => ({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        total: inv.total,
        status: inv.status,
        createdAt: inv.createdAt,
        invoiceDate: inv.invoiceDate
      }))

    // Calculate average invoice value
    const averageInvoiceValue = totalInvoices > 0 
      ? allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / totalInvoices 
      : 0

    // Calculate conversion rate (paid / total)
    const conversionRate = totalInvoices > 0 
      ? (paidInvoices / totalInvoices) * 100 
      : 0

    log.debug('Dashboard stats calculated', {
      totalInvoices,
      totalRevenue,
      paidInvoices
    })

    return {
      overview: {
        totalInvoices,
        totalRevenue,
        pendingRevenue,
        paidInvoices,
        pendingInvoices,
        draftInvoices,
        cancelledInvoices,
        averageInvoiceValue,
        conversionRate
      },
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue
      })),
      monthlyCount: Object.entries(monthlyCount).map(([month, count]) => ({
        month,
        count
      })),
      statusDistribution,
      revenueByStatus,
      recentInvoices
    }
  } catch (error: any) {
    logger.error('Failed to fetch dashboard stats', {
      context: { route: '/api/dashboard/stats', method: 'GET' },
      error
    })
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch dashboard stats'
    })
  }
})

