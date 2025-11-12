<template>
  <div class="page-shell tw-space-y-8">
    <header class="page-header">
      <div>
        <p class="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-[#22c55e]">Overview</p>
        <h1>Accounting Dashboard</h1>
        <p class="tw-text-gray-500 tw-mt-2">
          Monitor revenue, invoice health, and customer activity at a glance.
        </p>
      </div>
    </header>

    <div class="card-shell controls-bar">
      <div class="controls-grid">
        <div class="tw-relative tw-flex-1 tw-min-w-[200px]">
          <svg
            class="tw-absolute tw-left-3 tw-top-2.5 tw-w-4 tw-h-4 tw-text-gray-400"
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            v-model="filters.search"
            type="search"
            placeholder="Search clients or invoices"
            class="search-input tw-pl-9"
          />
        </div>
        <select v-model="filters.range" class="filter-select tw-w-40 tw-min-w-[160px]">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last quarter</option>
        </select>
        <select v-model="filters.status" class="filter-select tw-w-40 tw-min-w-[160px]">
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      <button class="btn btn-ghost export-btn">
        <svg class="tw-w-4 tw-h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
        </svg>
        Export data
      </button>
    </div>

    <section class="tw-grid tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-4">
      <DashboardStat
        title="Monthly Recurring Revenue"
        :value="formatCurrency(metrics.mrr)"
        :delta="metrics.mrrDelta"
        delta-label="vs last month"
        color="indigo"
      />
      <DashboardStat
        title="Customer Acquisition Cost"
        :value="formatCurrency(metrics.cac)"
        :delta="metrics.cacDelta"
        delta-label="vs last month"
        color="violet"
      />
      <DashboardStat
        title="Churn Rate"
        :value="metrics.churn + '%'"
        :delta="metrics.churnDelta"
        delta-label="vs last month"
        color="sky"
      />
      <DashboardStat
        title="Customer Lifetime Value"
        :value="formatCurrency(metrics.clv)"
        :delta="metrics.clvDelta"
        delta-label="vs last month"
        color="emerald"
      />
    </section>

    <section class="card-shell tw-space-y-6">
      <div class="tw-flex tw-flex-col xl:tw-flex-row xl:tw-items-center xl:tw-justify-between tw-gap-4">
        <div>
          <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Total Revenue</h2>
          <p class="tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-400">This period vs last period</p>
        </div>
        <div class="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-text-gray-500">
          <span class="legend legend-current"></span> This week
          <span class="legend legend-previous"></span> Last week
        </div>
      </div>
      <div>
        <svg viewBox="0 0 620 220" class="tw-w-full">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#705cff" stop-opacity="0.28" />
              <stop offset="100%" stop-color="#705cff" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path :d="areaPath" fill="url(#areaGradient)" />
          <path :d="linePath" stroke="#6f63ff" stroke-width="3" fill="none" stroke-linecap="round" />
          <g v-for="point in chartPoints" :key="point.label">
            <circle :cx="point.x" :cy="point.y" r="4" fill="#6f63ff" />
            <text :x="point.x" y="204" text-anchor="middle" class="chart-label">{{ point.label }}</text>
          </g>
        </svg>
      </div>
    </section>

    <section class="table-panel">
      <div
        class="tw-px-6 tw-py-4 tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between tw-gap-3 tw-border-b tw-border-gray-100"
      >
        <div>
          <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Content Performance</h2>
          <p class="tw-text-sm tw-text-gray-500">Snapshot of invoice activity within the selected range.</p>
        </div>
        <div class="tw-flex tw-items-center tw-gap-3">
          <div class="tw-relative">
            <svg
              class="tw-absolute tw-left-3 tw-top-2.5 tw-w-4 tw-h-4 tw-text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="currentColor"
              fill="none"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
            <input type="search" placeholder="Search invoices" class="search-input tw-pl-9 tw-w-60" />
          </div>
          <button class="btn btn-ghost">
            <svg class="tw-w-4 tw-h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v3H3V4zM3 9h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
            </svg>
            Filter
          </button>
        </div>
      </div>
      <div class="tw-overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Issued date</th>
              <th>Status</th>
              <th class="tw-text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice in tableRows" :key="invoice._id">
              <td>
                <div class="tw-font-semibold tw-text-gray-900">{{ invoice.invoiceNumber }}</div>
                <div class="tw-text-xs tw-text-gray-400">{{ invoice.items.length }} items</div>
              </td>
              <td>
                <div class="tw-font-medium tw-text-gray-900">{{ invoice.customerName }}</div>
                <div class="tw-text-xs tw-text-gray-400">{{ invoice.customerEmail }}</div>
              </td>
              <td class="tw-text-gray-600">{{ formatDate(invoice.invoiceDate || invoice.createdAt) }}</td>
              <td>
                <span :class="['chip', statusColor(invoice.status)]">{{ invoice.status }}</span>
              </td>
              <td class="tw-text-right tw-font-semibold tw-text-gray-900">
                {{ formatCurrency(invoice.total, invoice.currency) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

declare function definePageMeta(meta: any): void

definePageMeta({ middleware: 'auth' })

const loading = ref(true)
const invoices = ref<any[]>([])

const filters = reactive({
  search: '',
  range: '30',
  status: 'all'
})

const quickFilter = ref<'all' | 'high' | 'recent'>('all')

const metrics = reactive({
  mrr: 0,
  mrrDelta: 6.4,
  cac: 0,
  cacDelta: 2.4,
  churn: 2.1,
  churnDelta: -0.3,
  clv: 359,
  clvDelta: 1.5,
  sent: 0,
  sentDelta: 4.8,
  clients: 0,
  clientsDelta: 3.2,
  outstanding: 0,
  avgCollection: 0,
  overdue: 0,
  completion: 0
})

const $fetch = useRequestFetch()

onMounted(async () => {
  try {
    const data = await $fetch<any[]>('/api/invoices')
    invoices.value = data
    computeMetrics()
  } catch (error) {
    console.error('Error fetching invoices:', error)
  } finally {
    loading.value = false
  }
})

const filteredInvoices = computed(() => {
  const rangeDays = Number(filters.range)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - rangeDays)

  return invoices.value.filter((invoice: any) => {
    const issueDate = new Date(invoice.invoiceDate || invoice.createdAt)
    const matchesRange = issueDate >= startDate
    const matchesSearch = filters.search
      ? `${invoice.invoiceNumber} ${invoice.customerName} ${invoice.customerEmail}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      : true
    const matchesStatus = filters.status === 'all' ? true : invoice.status === filters.status

    let matchesQuick = true
    if (quickFilter.value === 'high') {
      matchesQuick = invoice.total >= 500
    }
    if (quickFilter.value === 'recent') {
      const diff = (Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
      matchesQuick = diff <= 10
    }

    return matchesRange && matchesSearch && matchesStatus && matchesQuick
  })
})

const tableRows = computed(() => filteredInvoices.value.slice(0, 8))

const chartPoints = computed(() => {
  const points: { label: string; value: number }[] = []
  const rangeDays = Number(filters.range)
  const days = Math.min(rangeDays, 30)
  const buckets: Record<string, number> = {}

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    buckets[label] = 0
    invoices.value.forEach((invoice: any) => {
      const issueDate = new Date(invoice.invoiceDate || invoice.createdAt)
      if (
        issueDate.getDate() === date.getDate() &&
        issueDate.getMonth() === date.getMonth() &&
        issueDate.getFullYear() === date.getFullYear()
      ) {
        buckets[label] += invoice.total
      }
    })
  }

  Object.entries(buckets).forEach(([label, value]) => points.push({ label, value }))
  const maxValue = Math.max(...points.map((p) => p.value), 1)
  const width = 560
  const height = 160
  return points.map((point, index) => ({
    label: point.label,
    value: point.value,
    x: 20 + (width / (points.length - 1 || 1)) * index,
    y: 40 + (height - (point.value / maxValue) * height)
  }))
})

const linePath = computed(() => {
  if (!chartPoints.value.length) return ''
  return chartPoints.value.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
})

const areaPath = computed(() => {
  if (!chartPoints.value.length) return ''
  const baseline = 200
  const start = `M ${chartPoints.value[0].x} ${baseline}`
  const lines = chartPoints.value.map((point) => `L ${point.x} ${point.y}`).join(' ')
  const end = `L ${chartPoints.value[chartPoints.value.length - 1].x} ${baseline} Z`
  return `${start} ${lines} ${end}`
})

function computeMetrics() {
  if (!invoices.value.length) return
  const paidInvoices = invoices.value.filter((i: any) => i.status === 'paid')
  metrics.sent = invoices.value.length
  metrics.clients = new Set(invoices.value.map((i: any) => i.customerEmail)).size
  metrics.outstanding = invoices.value.reduce((sum: number, i: any) => {
    const paid = i.payments?.reduce((total: number, p: any) => total + (p.amount || 0), 0) || 0
    return sum + Math.max(i.total - paid, 0)
  }, 0)
  metrics.avgCollection = paidInvoices.length
    ? Math.round(
        paidInvoices.reduce((sum: number, i: any) => {
          const issue = new Date(i.invoiceDate || i.createdAt).getTime()
          const paidDate = new Date(i.updatedAt).getTime()
          return sum + Math.max(0, (paidDate - issue) / (1000 * 60 * 60 * 24))
        }, 0) / paidInvoices.length
      )
    : 0
  metrics.overdue = invoices.value.filter((i: any) => {
    if (!i.dueDate) return false
    const due = new Date(i.dueDate)
    const paid = i.payments?.reduce((total: number, p: any) => total + (p.amount || 0), 0) || 0
    return due < new Date() && paid < i.total
  }).length
  const totalVolume = invoices.value.reduce((sum: number, i: any) => sum + i.total, 0)
  metrics.completion = totalVolume ? Math.round((1 - metrics.outstanding / totalVolume) * 100) : 0
  metrics.mrr = paidInvoices.reduce((sum: number, i: any) => sum + i.total, 0)
  metrics.cac = metrics.clients ? Math.round((totalVolume || 0) / metrics.clients) : 0
  metrics.churn = invoices.value.length ? Math.round((metrics.overdue / invoices.value.length) * 1000) / 10 : 0
}

async function downloadPdf(id: string) {
  try {
    const buffer = await $fetch<ArrayBuffer>(`/api/invoices/${id}/pdf`, {
      method: 'GET',
      responseType: 'arrayBuffer'
    })
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download PDF', error)
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'paid':
      return 'chip-paid'
    case 'partial':
      return 'chip-partial'
    case 'sent':
      return 'chip-sent'
    case 'draft':
    default:
      return 'chip-draft'
  }
}

function formatCurrency(value: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value || 0)
  } catch {
    return `$${Number(value || 0).toFixed(2)}`
  }
}

function formatDate(value?: string | Date) {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.filter-select {
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  font-size: 0.85rem;
  color: #4b5563;
  background: white;
}
.filter-select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.5);
}
.legend {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  margin-right: 4px;
}
.legend-current {
  background: var(--primary);
}
.legend-previous {
  background: rgba(34, 197, 94, 0.3);
}
.chart-label {
  font-size: 10px;
  fill: #9ca3af;
}
.pill {
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid var(--border-color);
  background: var(--surface);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}
.pill-active {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(34, 197, 94, 0.12);
}
.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}
.chip-paid { background: rgba(34, 197, 94, 0.15); color: var(--primary-hover); }
.chip-partial { background: rgba(59, 130, 246, 0.12); color: #2563eb; }
.chip-sent { background: rgba(245, 158, 11, 0.15); color: #b45309; }
.chip-draft { background: rgba(148, 163, 184, 0.18); color: #475569; }
.table-action {
  color: var(--primary);
  font-weight: 600;
  font-size: 0.8rem;
}
.controls-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.controls-grid {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1 1 auto;
  flex-wrap: wrap;
}
.export-btn {
  white-space: nowrap;
}
</style>


