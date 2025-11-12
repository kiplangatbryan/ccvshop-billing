<template>
  <div class="page-shell tw-space-y-8">
    <header class="page-header">
      <div>
        <p class="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-[#22c55e]">Billing</p>
        <h1>Invoice Workspace</h1>
        <p class="tw-text-gray-500 tw-mt-2">
          Track invoice performance, manage payments, and keep clients in the loop.
        </p>
      </div>
    </header>

    <VSheet class="card-shell tw-space-y-4">
      <VRow dense class="tw-gap-y-4">
        <VCol cols="12" md="4">
          <VTextField
            v-model="filters.search"
            label="Search invoices or clients"
            variant="outlined"
            density="comfortable"
            color="primary"
            prepend-inner-icon="mdi-magnify"
            clearable
          />
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VSelect
            v-model="filters.status"
            :items="statusItems"
            item-title="label"
            item-value="value"
            label="Status"
            variant="outlined"
            density="comfortable"
            color="primary"
          />
        </VCol>
        <VCol cols="12" sm="6" md="2">
          <VTextField
            v-model="filters.dateFrom"
            type="date"
            label="From"
            variant="outlined"
            density="comfortable"
            color="primary"
          />
        </VCol>
        <VCol cols="12" sm="6" md="2">
          <VTextField
            v-model="filters.dateTo"
            type="date"
            label="To"
            variant="outlined"
            density="comfortable"
            color="primary"
          />
        </VCol>
      </VRow>
      <div class="tw-flex tw-flex-wrap tw-gap-3 tw-justify-between tw-items-center">
        <VBtn variant="text" color="secondary" prepend-icon="mdi-refresh" @click="resetFilters">
          Reset
        </VBtn>
        <VBtn color="primary" prepend-icon="mdi-plus" :to="{ path: '/invoices/create' }">
          New Invoice
        </VBtn>
      </div>
    </VSheet>

    <section class="tw-grid tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-4">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="card-shell tw-flex tw-flex-col tw-gap-3"
      >
        <div class="tw-flex tw-items-center tw-justify-between">
          <span class="tw-text-sm tw-font-medium tw-text-gray-500">{{ card.label }}</span>
          <span :class="['badge-soft', card.trend >= 0 ? 'badge-green' : 'badge-red']">
            {{ card.trend >= 0 ? '+' : '' }}{{ card.trend }}%
          </span>
        </div>
        <p class="tw-text-2xl tw-font-semibold tw-text-gray-900">{{ card.value }}</p>
        <p class="tw-text-xs tw-text-gray-400">{{ card.helper }}</p>
      </div>
    </section>

    <section class="tw-grid tw-gap-6 xl:tw-grid-cols-[1.55fr,1fr]">
      <div class="table-panel">
        <div class="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-border-gray-100">
          <div>
            <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Invoices</h2>
            <p class="tw-text-sm tw-text-gray-500">
              Showing {{ filteredInvoices.length }} of {{ invoices.length }} invoices
            </p>
          </div>
        </div>
        <div class="tw-overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Issued / Due</th>
                <th>Amount</th>
                <th>Status</th>
                <th class="tw-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="invoice in filteredInvoices"
                :key="invoice._id"
                :class="{ 'tw-bg-[rgba(111,99,255,0.05)]': selectedInvoice?._id === invoice._id }"
                @click="selectInvoice(invoice)"
              >
                <td>
                  <div class="tw-font-semibold tw-text-gray-900">{{ invoice.invoiceNumber }}</div>
                  <div class="tw-text-xs tw-text-gray-400">
                    {{ invoice.items.length }} items · {{ invoice.currency || 'USD' }}
                  </div>
                </td>
                <td>
                  <div class="tw-font-medium tw-text-gray-900">{{ invoice.customerName }}</div>
                  <div class="tw-text-xs tw-text-gray-400">{{ invoice.customerEmail }}</div>
                </td>
                <td class="tw-text-gray-600">
                  <div>{{ formatDate(invoice.invoiceDate || invoice.createdAt) }}</div>
                  <div class="tw-text-xs tw-text-gray-400">
                    Due {{ invoice.dueDate ? formatDate(invoice.dueDate) : '—' }}
                  </div>
                </td>
                <td class="tw-font-semibold tw-text-gray-900">{{ formatCurrency(invoice.total, invoice.currency) }}</td>
                <td>
                  <span :class="['chip', statusColor(invoice.status)]">{{ invoice.status }}</span>
                </td>
                <td class="tw-text-right tw-space-x-3">
                  <NuxtLink :to="`/invoices/${invoice._id}`" class="table-action">View</NuxtLink>
                  <button class="table-action" @click.stop="downloadPdf(invoice._id)">PDF</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>

      <div class="card-shell tw-space-y-5">
        <div class="tw-flex tw-items-center tw-justify-between">
          <div>
            <p class="tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-400">Quick preview</p>
            <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">
              {{ selectedInvoice?.invoiceNumber || 'Select an invoice' }}
            </h2>
          </div>
          <NuxtLink
            v-if="selectedInvoice"
            :to="`/invoices/${selectedInvoice._id}`"
            class="btn btn-ghost"
          >
            Open invoice
          </NuxtLink>
        </div>
        <div v-if="!selectedInvoice" class="tw-text-sm tw-text-gray-500">
          Choose an invoice from the table to view client details, totals, and status.
        </div>
        <div v-else class="tw-space-y-4 tw-text-sm">
          <div>
            <p class="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-400 tw-mb-1">Client</p>
            <p class="tw-font-medium tw-text-gray-900">{{ selectedInvoice.customerName }}</p>
            <p class="tw-text-gray-500">{{ selectedInvoice.customerEmail }}</p>
          </div>
          <div class="tw-grid tw-grid-cols-2 tw-gap-3">
            <div>
              <p class="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-400 tw-mb-1">Issued</p>
              <p class="tw-font-medium tw-text-gray-900">
                {{ formatDate(selectedInvoice.invoiceDate || selectedInvoice.createdAt) }}
              </p>
            </div>
            <div>
              <p class="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-400 tw-mb-1">Due date</p>
              <p class="tw-font-medium tw-text-gray-900">
                {{ selectedInvoice.dueDate ? formatDate(selectedInvoice.dueDate) : '—' }}
              </p>
            </div>
                </div>
          <div>
            <p class="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-400 tw-mb-1">Amounts</p>
            <p class="tw-text-xl tw-font-semibold tw-text-gray-900">
              {{ formatCurrency(selectedInvoice.total, selectedInvoice.currency) }}
            </p>
            <p class="tw-text-xs tw-text-gray-500">
              Paid {{ formatCurrency(getPaidAmount(selectedInvoice), selectedInvoice.currency) }} ·
              Outstanding {{ formatCurrency(Math.max(selectedInvoice.total - getPaidAmount(selectedInvoice), 0), selectedInvoice.currency) }}
                </p>
              </div>
          <div>
            <p class="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-400 tw-mb-1">Memo</p>
            <p class="tw-text-gray-600" v-if="selectedInvoice.memo">{{ selectedInvoice.memo }}</p>
            <p class="tw-text-gray-400" v-else>No memo recorded.</p>
                </div>
          <div>
            <p class="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-400 tw-mb-2">Line items</p>
            <div class="tw-space-y-2 tw-max-h-48 tw-overflow-y-auto tw-pr-1">
              <div
                v-for="(item, idx) in selectedInvoice.items"
                :key="idx"
                class="tw-border tw-border-gray-100 tw-rounded-xl tw-px-3 tw-py-2 tw-flex tw-justify-between tw-text-sm"
              >
                <div>
                  <p class="tw-font-medium tw-text-gray-900">{{ item.productName }}</p>
                  <p class="tw-text-xs tw-text-gray-400">
                    {{ item.sizeLabel || '—' }} · {{ item.quantity }} × {{ formatCurrency(item.price, selectedInvoice.currency) }}
                  </p>
                </div>
                <p class="tw-font-semibold tw-text-gray-900">{{ formatCurrency(item.total, selectedInvoice.currency) }}</p>
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

const loading = ref(true)
const invoices = ref<any[]>([])
const selectedInvoice = ref<any | null>(null)
const $fetch = useRequestFetch()

const statusItems = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Partial', value: 'partial' },
  { label: 'Paid', value: 'paid' },
  { label: 'Cancelled', value: 'cancelled' }
]

const filters = reactive({
  search: '',
  status: 'all',
  dateFrom: '',
  dateTo: ''
})

const summary = reactive({
  billed: 0,
  outstanding: 0,
  sent: 0,
  clients: 0
})

onMounted(async () => {
  try {
    const data = await $fetch<any[]>('/api/invoices')
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

    return matchesSearch && matchesStatus && matchesFrom && matchesTo
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
}

function selectInvoice(invoice: any) {
  selectedInvoice.value = invoice
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

