<template>
  <div class="page-shell tw-space-y-8">
    <!-- Page Header -->
    <header class="page-header">
      <div>
        <p class="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-[#22c55e]">Analytics</p>
        <h1>Dashboard</h1>
        <p class="tw-text-gray-500 tw-mt-2">
          Overview of your invoice statistics and performance metrics.
        </p>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="tw-flex tw-items-center tw-justify-center tw-py-20">
      <VProgressCircular indeterminate color="primary" size="64" />
    </div>

    <!-- Dashboard Content -->
    <div v-else class="tw-space-y-8">
      <!-- Overview Stats Cards -->
      <section class="tw-grid tw-gap-6 md:tw-grid-cols-2 xl:tw-grid-cols-4">
        <VSheet
          v-for="card in summaryCards"
          :key="card.label"
          elevation="0"
          class="card-shell tw-flex tw-flex-col tw-gap-4"
        >
          <div class="tw-flex tw-items-start tw-justify-between">
            <div>
              <p class="tw-text-sm tw-font-medium tw-text-gray-500">{{ card.label }}</p>
              <p class="tw-text-2xl tw-font-semibold tw-text-gray-900">{{ card.value }}</p>
            </div>
            <VChip
              v-if="card.trend !== undefined"
              :color="card.trend >= 0 ? (card.positive ? 'success' : 'error') : card.positive ? 'error' : 'success'"
              variant="flat"
              size="small"
              class="tw-font-semibold tw-rounded-full"
            >
              {{ card.trend >= 0 ? '+' : '' }}{{ card.trend }}%
            </VChip>
          </div>
          <p v-if="card.helper" class="tw-text-xs tw-text-gray-500">{{ card.helper }}</p>
        </VSheet>
      </section>

      <!-- Charts Row -->
      <div class="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        <!-- Monthly Revenue Chart -->
        <VSheet class="card-shell tw-space-y-4">
          <div class="tw-flex tw-items-center tw-justify-between">
            <div>
              <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Monthly Revenue</h2>
              <p class="tw-text-sm tw-text-gray-500">Revenue trends over the last 6 months</p>
            </div>
          </div>
          <div class="tw-h-64">
            <Line
              v-if="chartData.monthlyRevenue"
              :data="chartData.monthlyRevenue"
              :options="chartOptions.line"
            />
          </div>
        </VSheet>

        <!-- Status Distribution Chart -->
        <VSheet class="card-shell tw-space-y-4">
          <div class="tw-flex tw-items-center tw-justify-between">
            <div>
              <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Invoice Status</h2>
              <p class="tw-text-sm tw-text-gray-500">Distribution of invoices by status</p>
            </div>
          </div>
          <div class="tw-h-64">
            <Doughnut
              v-if="chartData.statusDistribution"
              :data="chartData.statusDistribution"
              :options="chartOptions.doughnut"
            />
          </div>
        </VSheet>
      </div>

      <!-- Additional Charts Row -->
      <div class="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        <!-- Monthly Invoice Count -->
        <VSheet class="card-shell tw-space-y-4">
          <div class="tw-flex tw-items-center tw-justify-between">
            <div>
              <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Monthly Invoice Count</h2>
              <p class="tw-text-sm tw-text-gray-500">Number of invoices created per month</p>
            </div>
          </div>
          <div class="tw-h-64">
            <Bar
              v-if="chartData.monthlyCount"
              :data="chartData.monthlyCount"
              :options="chartOptions.bar"
            />
          </div>
        </VSheet>

        <!-- Revenue by Status -->
        <VSheet class="card-shell tw-space-y-4">
          <div class="tw-flex tw-items-center tw-justify-between">
            <div>
              <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Revenue by Status</h2>
              <p class="tw-text-sm tw-text-gray-500">Revenue breakdown by invoice status</p>
            </div>
          </div>
          <div class="tw-h-64">
            <Bar
              v-if="chartData.revenueByStatus"
              :data="chartData.revenueByStatus"
              :options="chartOptions.revenueBar"
            />
          </div>
        </VSheet>
      </div>

      <!-- Recent Invoices -->
      <VSheet class="card-shell tw-space-y-4">
        <div class="tw-flex tw-items-center tw-justify-between">
          <div>
            <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Recent Invoices</h2>
            <p class="tw-text-sm tw-text-gray-500">Latest invoice activity</p>
          </div>
          <VBtn
            color="primary"
            prepend-icon="mdi-arrow-right"
            variant="text"
            to="/invoices"
          >
            View All
          </VBtn>
        </div>
        <div>
          <VTable>
            <thead>
              <tr>
                <th class="tw-text-left tw-px-6 tw-py-3 tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase">
                  Invoice Number
                </th>
                <th class="tw-text-left tw-px-6 tw-py-3 tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase">
                  Customer
                </th>
                <th class="tw-text-right tw-px-6 tw-py-3 tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase">
                  Amount
                </th>
                <th class="tw-text-center tw-px-6 tw-py-3 tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase">
                  Status
                </th>
                <th class="tw-text-right tw-px-6 tw-py-3 tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="invoice in stats?.recentInvoices || []"
                :key="invoice._id"
                class="hover:tw-bg-gray-50 tw-cursor-pointer"
                @click="navigateToInvoice(invoice._id)"
              >
                <td class="tw-px-6 tw-py-4">
                  <span class="tw-font-semibold tw-text-gray-900">{{ invoice.invoiceNumber }}</span>
                </td>
                <td class="tw-px-6 tw-py-4">
                  <span class="tw-text-gray-700">{{ invoice.customerName }}</span>
                </td>
                <td class="tw-px-6 tw-py-4 tw-text-right">
                  <span class="tw-font-semibold tw-text-gray-900">
                    {{ formatCurrency(invoice.total) }}
                  </span>
                </td>
                <td class="tw-px-6 tw-py-4 tw-text-center">
                  <VChip
                    :color="getStatusColor(invoice.status)"
                    size="small"
                    variant="flat"
                  >
                    {{ invoice.status }}
                  </VChip>
                </td>
                <td class="tw-px-6 tw-py-4 tw-text-right">
                  <span class="tw-text-sm tw-text-gray-500">
                    {{ formatDate(invoice.invoiceDate || invoice.createdAt) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!stats?.recentInvoices || stats.recentInvoices.length === 0">
                <td colspan="5" class="tw-px-6 tw-py-8 tw-text-center tw-text-gray-500">
                  No invoices yet
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VSheet>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line, Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

definePageMeta({ middleware: 'auth' })

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const loading = ref(true)
const stats = ref<any>(null)

// Summary cards
const summaryCards = computed(() => {
  if (!stats.value) return []
  
  const overview = stats.value.overview || {}
  return [
    {
      label: 'Total Revenue',
      value: formatCurrency(overview.totalRevenue || 0),
      helper: 'From paid invoices',
      trend: undefined,
      positive: true
    },
    {
      label: 'Total Invoices',
      value: overview.totalInvoices || 0,
      helper: `${overview.paidInvoices || 0} paid, ${overview.pendingInvoices || 0} pending`,
      trend: undefined,
      positive: true
    },
    {
      label: 'Paid Invoices',
      value: overview.paidInvoices || 0,
      helper: `${overview.conversionRate?.toFixed(1) || 0}% conversion rate`,
      trend: undefined,
      positive: true
    },
    {
      label: 'Pending Revenue',
      value: formatCurrency(overview.pendingRevenue || 0),
      helper: 'Unpaid invoices',
      trend: undefined,
      positive: false
    }
  ]
})

// Chart data
const chartData = computed(() => {
  if (!stats.value) {
    return {
      monthlyRevenue: null,
      statusDistribution: null,
      monthlyCount: null,
      revenueByStatus: null
    }
  }

  // Monthly Revenue Chart
  const monthlyRevenue = {
    labels: stats.value.monthlyRevenue?.map((item: any) => {
      const [year, month] = item.month.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }) || [],
    datasets: [
      {
        label: 'Revenue',
        data: stats.value.monthlyRevenue?.map((item: any) => item.revenue) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  // Status Distribution Chart
  const statusDistribution = {
    labels: ['Paid', 'Pending', 'Draft', 'Cancelled'],
    datasets: [
      {
        data: [
          stats.value.statusDistribution?.paid || 0,
          stats.value.statusDistribution?.pending || 0,
          stats.value.statusDistribution?.draft || 0,
          stats.value.statusDistribution?.cancelled || 0
        ],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 0
      }
    ]
  }

  // Monthly Count Chart
  const monthlyCount = {
    labels: stats.value.monthlyCount?.map((item: any) => {
      const [year, month] = item.month.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }) || [],
    datasets: [
      {
        label: 'Invoice Count',
        data: stats.value.monthlyCount?.map((item: any) => item.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  }

  // Revenue by Status Chart
  const revenueByStatus = {
    labels: ['Paid', 'Pending', 'Draft', 'Cancelled'],
    datasets: [
      {
        label: 'Revenue',
        data: [
          stats.value.revenueByStatus?.paid || 0,
          stats.value.revenueByStatus?.pending || 0,
          stats.value.revenueByStatus?.draft || 0,
          stats.value.revenueByStatus?.cancelled || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }
    ]
  }

  return {
    monthlyRevenue,
    statusDistribution,
    monthlyCount,
    revenueByStatus
  }
})

// Chart options
const chartOptions = computed(() => ({
  line: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Revenue: ${formatCurrency(context.parsed.y)}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatCurrency(value)
        }
      }
    }
  },
  doughnut: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return `${label}: ${value} (${percentage}%)`
          }
        }
      }
    }
  },
  bar: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label || ''}: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  },
  revenueBar: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Revenue: ${formatCurrency(context.parsed.y)}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatCurrency(value)
        }
      }
    }
  }
}))

// Fetch dashboard stats
const fetchStats = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/dashboard/stats')
    stats.value = response
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
  } finally {
    loading.value = false
  }
}

// Format currency
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Format date
const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get status color
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    paid: 'success',
    sent: 'info',
    partial: 'warning',
    draft: 'default',
    cancelled: 'error'
  }
  return colors[status] || 'default'
}

// Navigate to invoice
const navigateToInvoice = (invoiceId: string) => {
  navigateTo(`/invoices/${invoiceId}`)
}

onMounted(() => {
  fetchStats()
})
</script>

