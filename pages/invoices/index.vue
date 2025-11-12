<template>
  <div class="page-shell space-y-8">
    <header class="page-header">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-[#22c55e]">Billing</p>
        <h1>Invoice Workspace</h1>
        <p class="text-gray-500 mt-2">Track invoice performance, manage payments, and keep clients in the loop.</p>
      </div>
    </header>

    <div class="card-shell controls-bar">
      <div class="controls-grid">
        <div class="relative flex-1 min-w-[220px]">
          <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            v-model="filters.search"
            type="search"
            placeholder="Search invoices or clients"
            class="search-input pl-9"
          />
        </div>
        <select v-model="filters.status" class="filter-select w-40 min-w-[160px]">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button class="btn btn-ghost" type="button" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? 'Hide filters' : 'Advanced filters' }}
        </button>
      </div>
      <NuxtLink to="/invoices/create" class="btn btn-primary">New Invoice</NuxtLink>
    </div>

    <transition name="fade">
      <div v-if="showAdvanced" class="card-shell grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Date from</label>
          <input v-model="filters.dateFrom" type="date" class="input-control" />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Date to</label>
          <input v-model="filters.dateTo" type="date" class="input-control" />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Min total</label>
          <input v-model.number="filters.minTotal" type="number" min="0" step="0.01" class="input-control" placeholder="0.00" />
        </div>
        <div>
          <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Max total</label>
          <input v-model.number="filters.maxTotal" type="number" min="0" step="0.01" class="input-control" placeholder="Any" />
        </div>
        <div class="md:col-span-2 xl:col-span-1">
          <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Memo contains</label>
          <input v-model="filters.memo" type="text" class="input-control" placeholder="Keyword" />
        </div>
        <div class="md:col-span-2 xl:col-span-5 flex justify-end gap-3">
          <button class="btn btn-ghost" type="button" @click="resetFilters">Reset</button>
        </div>
    </div>
    </transition>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="card-shell flex flex-col gap-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">{{ card.label }}</span>
          <span :class="['badge-soft', card.trend >= 0 ? 'badge-green' : 'badge-red']">
            {{ card.trend >= 0 ? '+' : '' }}{{ card.trend }}%
          </span>
        </div>
        <p class="text-2xl font-semibold text-gray-900">{{ card.value }}</p>
        <p class="text-xs text-gray-400">{{ card.helper }}</p>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.55fr,1fr]">
      <div class="table-panel">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Invoices</h2>
            <p class="text-sm text-gray-500">Showing {{ filteredInvoices.length }} of {{ invoices.length }} invoices</p>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Issued / Due</th>
                <th>Amount</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="invoice in filteredInvoices"
                :key="invoice._id"
                :class="{ 'bg-[rgba(111,99,255,0.05)]': selectedInvoice?._id === invoice._id }"
                @click="selectInvoice(invoice)"
              >
                <td>
                  <div class="font-semibold text-gray-900">{{ invoice.invoiceNumber }}</div>
                  <div class="text-xs text-gray-400">{{ invoice.items.length }} items · {{ invoice.currency || 'USD' }}</div>
                </td>
                <td>
                  <div class="font-medium text-gray-900">{{ invoice.customerName }}</div>
                  <div class="text-xs text-gray-400">{{ invoice.customerEmail }}</div>
                </td>
                <td class="text-gray-600">
                  <div>{{ formatDate(invoice.invoiceDate || invoice.createdAt) }}</div>
                  <div class="text-xs text-gray-400">Due {{ invoice.dueDate ? formatDate(invoice.dueDate) : '—' }}</div>
                </td>
                <td class="font-semibold text-gray-900">{{ formatCurrency(invoice.total, invoice.currency) }}</td>
                <td>
                  <span :class="['chip', statusColor(invoice.status)]">{{ invoice.status }}</span>
                </td>
                <td class="text-right space-x-3">
                  <NuxtLink :to="`/invoices/${invoice._id}`" class="table-action">View</NuxtLink>
                  <button class="table-action" @click.stop="downloadPdf(invoice._id)">PDF</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>

      <div class="card-shell space-y-5">
            <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-gray-400">Quick preview</p>
            <h2 class="text-lg font-semibold text-gray-900">{{ selectedInvoice?.invoiceNumber || 'Select an invoice' }}</h2>
          </div>
          <NuxtLink
            v-if="selectedInvoice"
            :to="`/invoices/${selectedInvoice._id}`"
            class="btn btn-ghost"
          >
            Open invoice
          </NuxtLink>
        </div>
        <div v-if="!selectedInvoice" class="text-sm text-gray-500">
          Choose an invoice from the table to view client details, totals, and status.
        </div>
        <div v-else class="space-y-4 text-sm">
          <div>
            <p class="text-xs font-semibold uppercase text-gray-400 mb-1">Client</p>
            <p class="font-medium text-gray-900">{{ selectedInvoice.customerName }}</p>
            <p class="text-gray-500">{{ selectedInvoice.customerEmail }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs font-semibold uppercase text-gray-400 mb-1">Issued</p>
              <p class="font-medium text-gray-900">{{ formatDate(selectedInvoice.invoiceDate || selectedInvoice.createdAt) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-gray-400 mb-1">Due date</p>
              <p class="font-medium text-gray-900">{{ selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : '—' }}</p>
            </div>
                </div>
          <div>
            <p class="text-xs font-semibold uppercase text-gray-400 mb-1">Amounts</p>
            <p class="text-xl font-semibold text-gray-900">{{ formatCurrency(selectedInvoice.total, selectedInvoice.currency) }}</p>
            <p class="text-xs text-gray-500">
              Paid {{ formatCurrency(getPaidAmount(selectedInvoice), selectedInvoice.currency) }} ·
              Outstanding {{ formatCurrency(Math.max(selectedInvoice.total - getPaidAmount(selectedInvoice), 0), selectedInvoice.currency) }}
                </p>
              </div>
          <div>
            <p class="text-xs font-semibold uppercase text-gray-400 mb-1">Memo</p>
            <p class="text-gray-600" v-if="selectedInvoice.memo">{{ selectedInvoice.memo }}</p>
            <p class="text-gray-400" v-else>No memo recorded.</p>
                </div>
          <div>
            <p class="text-xs font-semibold uppercase text-gray-400 mb-2">Line items</p>
            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
              <div
                v-for="(item, idx) in selectedInvoice.items"
                :key="idx"
                class="border border-gray-100 rounded-xl px-3 py-2 flex justify-between text-sm"
              >
                <div>
                  <p class="font-medium text-gray-900">{{ item.productName }}</p>
                  <p class="text-xs text-gray-400">
                    {{ item.sizeLabel || '—' }} · {{ item.quantity }} × {{ formatCurrency(item.price, selectedInvoice.currency) }}
                  </p>
                </div>
                <p class="font-semibold text-gray-900">{{ formatCurrency(item.total, selectedInvoice.currency) }}</p>
              </div>
            </div>
          </div>
        </div>
    </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { $fetch } from 'ofetch'

const loading = ref(true)
const invoices = ref<any[]>([])
const selectedInvoice = ref<any | null>(null)
const showAdvanced = ref(false)

const filters = reactive({
  search: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  minTotal: undefined as number | undefined,
  maxTotal: undefined as number | undefined,
  memo: ''
})

const summary = reactive({
  billed: 0,
  outstanding: 0,
  sent: 0,
  clients: 0
})

onMounted(async () => {
  try {
    const data = await $fetch('/api/invoices')
    invoices.value = data
    computeSummary()
    if (data.length) {
      selectedInvoice.value = data[0]
    }
  } catch (error) {
    console.error('Error fetching invoices:', error)
  } finally {
    loading.value = false
  }
})

const filteredInvoices = computed(() => {
  return invoices.value.filter((invoice: any) => {
    const haystack = `${invoice.invoiceNumber} ${invoice.customerName} ${invoice.customerEmail} ${invoice.memo || ''}`
      .toLowerCase()
    const matchesSearch = filters.search ? haystack.includes(filters.search.toLowerCase()) : true

    const matchesStatus = filters.status === 'all' ? true : invoice.status === filters.status

    const issueDate = new Date(invoice.invoiceDate || invoice.createdAt)
    const matchesFrom = filters.dateFrom ? issueDate >= new Date(filters.dateFrom) : true
    const matchesTo = filters.dateTo ? issueDate <= new Date(filters.dateTo) : true

    const total = Number(invoice.total) || 0
    const matchesMin = typeof filters.minTotal === 'number' ? total >= filters.minTotal : true
    const matchesMax = typeof filters.maxTotal === 'number' ? total <= filters.maxTotal : true

    const matchesMemo = filters.memo
      ? (invoice.memo || '').toLowerCase().includes(filters.memo.toLowerCase())
      : true

    return matchesSearch && matchesStatus && matchesFrom && matchesTo && matchesMin && matchesMax && matchesMemo
  })
})

watch(filteredInvoices, (list) => {
  if (!list.length) {
    selectedInvoice.value = null
    return
  }
  if (!selectedInvoice.value || !list.some((invoice) => invoice._id === selectedInvoice.value?._id)) {
    selectedInvoice.value = list[0]
  }
})

const summaryCards = computed(() => [
  {
    label: 'Total billed',
    value: formatCurrency(summary.billed),
    trend: 4.8,
    helper: 'Across all invoices'
  },
  {
    label: 'Outstanding',
    value: formatCurrency(summary.outstanding),
    trend: -2.1,
    helper: 'Awaiting payment'
  },
  {
    label: 'Invoices sent',
    value: summary.sent.toString(),
    trend: 3.4,
    helper: 'Active this quarter'
  },
  {
    label: 'Clients billed',
    value: summary.clients.toString(),
    trend: 3.2,
    helper: 'Unique customers'
  }
])

function computeSummary() {
  if (!invoices.value.length) return
  summary.billed = invoices.value.reduce((sum: number, invoice: any) => sum + invoice.total, 0)
  summary.outstanding = invoices.value.reduce((sum: number, invoice: any) => {
    const paid = getPaidAmount(invoice)
    return sum + Math.max(invoice.total - paid, 0)
  }, 0)
  summary.sent = invoices.value.length
  summary.clients = new Set(invoices.value.map((invoice: any) => invoice.customerEmail)).size
}

function resetFilters() {
  filters.search = ''
  filters.status = 'all'
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.minTotal = undefined
  filters.maxTotal = undefined
  filters.memo = ''
}

function selectInvoice(invoice: any) {
  selectedInvoice.value = invoice
}

async function downloadPdf(id: string) {
  try {
    const buffer = await $fetch(`/api/invoices/${id}/pdf`, {
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
      return 'chip-success'
    case 'partial':
      return 'chip-warning'
    case 'sent':
      return 'chip-muted'
    case 'cancelled':
      return 'chip-danger'
    case 'draft':
    default:
      return 'chip-muted'
  }
}

function getPaidAmount(invoice: any) {
  return invoice.payments?.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0) || 0
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

