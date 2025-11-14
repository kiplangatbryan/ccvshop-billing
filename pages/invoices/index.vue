<template>
  <div class="page-shell tw-space-y-8">
    <header class="page-header">
      <div>
        <p class="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-[#22c55e]">Billing</p>
        <h1>Invoices</h1>
        <p class="tw-text-gray-500 tw-mt-2">
          Track invoice performance, manage payments, and keep clients in the loop.
        </p>
      </div>
    </header>

    <section class="tw-grid tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-4">
      <VSheet
        v-for="card in summaryCards"
        :key="card.label"
        elevation="1"
        class="tw-rounded-3xl tw-border tw-border-gray-200 tw-bg-white tw-p-6 tw-shadow-sm tw-flex tw-flex-col tw-gap-4 tw-transition-shadow hover:tw-shadow-md"
      >
        <div class="tw-flex tw-items-start tw-justify-between">
          <div>
            <p class="tw-text-sm tw-font-medium tw-text-gray-500">{{ card.label }}</p>
            <p class="tw-text-2xl tw-font-semibold tw-text-gray-900">{{ card.value }}</p>
          </div>
          <VChip
            :color="card.trend >= 0 ? (card.positive ? 'success' : 'error') : card.positive ? 'error' : 'success'"
            variant="flat"
            size="small"
            class="tw-font-semibold tw-rounded-full"
          >
            {{ card.trend >= 0 ? '+' : '' }}{{ card.trend }}%
          </VChip>
        </div>
        <p class="tw-text-xs tw-text-gray-500">{{ card.helper }}</p>
      </VSheet>
    </section>

    <VSheet class="card-shell tw-space-y-4">
        <div class="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-border-gray-100">
          <div>
            <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Invoices</h2>
            <p class="tw-text-sm tw-text-gray-500">
            Showing {{ pagination.itemsPerPage }} per page
            </p>
        </div>
        <VBtn color="primary" prepend-icon="mdi-plus" :to="{ path: '/invoices/create' }">
          New Invoice
        </VBtn>
      </div>

      <div class="tw-px-6 tw-pb-4">
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
              @update:model-value="debouncedLoad"
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
              @update:model-value="loadInvoices"
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
              @update:model-value="loadInvoices"
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
              @update:model-value="loadInvoices"
            />
          </VCol>
          <VCol cols="12" sm="6" md="1">
            <VBtn
              variant="text"
              color="secondary"
              prepend-icon="mdi-refresh"
              @click="resetFilters"
              class="tw-w-full"
            >
              Reset
            </VBtn>
          </VCol>
        </VRow>
        <div v-if="selected.length > 0" class="tw-mt-4">
          <VBtn
            color="success"
            prepend-icon="mdi-check-circle"
            @click="confirmBulkMarkAsPaid"
            :loading="bulkLoading"
          >
            Mark {{ selected.length }} as Paid
          </VBtn>
        </div>
    </div>
      <VDataTable
        v-model="selected"
        :headers="headers"
        :items="invoices"
        :loading="loading"
        :items-per-page="pagination.itemsPerPage"
        :page="pagination.page"
        :items-per-page-options="[10, 25, 50, 100]"
        :server-items-length="pagination.total"
        :sort-by="[{ key: 'createdAt', order: 'desc' }]"
        show-select
        item-value="_id"
        class="tw-w-full"
        @update:options="onOptionsUpdate"
      >
        <template #[`item.invoiceNumber`]="{ item }">
          <div>
            <div class="tw-font-semibold tw-text-gray-900">{{ getItemData(item).invoiceNumber }}</div>
            <div class="tw-text-xs tw-text-gray-400">
              {{ getItemData(item).items?.length || 0 }} items · {{ getItemData(item).currency || 'USD' }}
            </div>
          </div>
        </template>

        <template #[`item.customerName`]="{ item }">
          <div>
            <div class="tw-font-medium tw-text-gray-900">{{ getItemData(item).customerName }}</div>
            <div class="tw-text-xs tw-text-gray-400">{{ getItemData(item).customerEmail }}</div>
          </div>
        </template>

        <template #[`item.dates`]="{ item }">
          <div class="tw-text-gray-600">
            <div>{{ formatDate(getItemData(item).invoiceDate || getItemData(item).createdAt) }}</div>
            <div class="tw-text-xs tw-text-gray-400">
              Due {{ getItemData(item).dueDate ? formatDate(getItemData(item).dueDate) : '—' }}
            </div>
                </div>
        </template>

        <template #[`item.total`]="{ item }">
          <span class="tw-font-semibold tw-text-gray-900">
            {{ formatCurrency(getItemData(item).total, getItemData(item).currency) }}
          </span>
        </template>

        <template #[`item.status`]="{ item }">
          <VChip
            :color="getStatusColor(getItemData(item).status)"
            variant="flat"
            size="small"
            class="tw-font-semibold"
          >
            {{ getItemData(item).status }}
          </VChip>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="tw-flex tw-gap-2 tw-justify-end">
            <VTooltip text="View Invoice" location="top">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  :to="`/invoices/${getItemData(item)._id}`"
                >
                  <VIcon>mdi-eye</VIcon>
                </VBtn>
              </template>
            </VTooltip>
            <VTooltip text="Edit Invoice" location="top">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  :to="`/invoices/edit/${getItemData(item)._id}`"
                >
                  <VIcon>mdi-pencil</VIcon>
                </VBtn>
              </template>
            </VTooltip>
            <VTooltip text="Download PDF" location="top">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  @click="downloadPdf(getItemData(item)._id)"
                >
                  <VIcon>mdi-download</VIcon>
                </VBtn>
              </template>
            </VTooltip>
            <VTooltip v-if="getItemData(item).status !== 'paid'" text="Mark as Paid" location="top">
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  icon
                  size="small"
                  variant="text"
                  color="success"
                  @click="confirmMarkAsPaid(getItemData(item))"
                  :loading="markingPaid === getItemData(item)._id"
                >
                  <VIcon>mdi-check-circle</VIcon>
                </VBtn>
              </template>
            </VTooltip>
          </div>
        </template>
      </VDataTable>
    </VSheet>

    <!-- Mark as Paid Confirmation Dialog -->
    <VDialog v-model="showMarkPaidDialog" max-width="500">
      <VCard>
        <VCardTitle class="tw-text-lg tw-font-semibold">
          Mark Invoice as Paid
        </VCardTitle>
        <VCardText>
          <p class="tw-mb-4">
            Are you sure you want to mark invoice <strong>{{ invoiceToMark?.invoiceNumber }}</strong> as paid?
          </p>
          <p class="tw-text-sm tw-text-gray-600">
            This action will update the invoice status and reduce product stock in your inventory.
          </p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showMarkPaidDialog = false">
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="flat"
            @click="executeMarkAsPaid"
            :loading="markingPaid !== null"
          >
            Mark as Paid
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk Mark as Paid Confirmation Dialog -->
    <VDialog v-model="showBulkMarkPaidDialog" max-width="500">
      <VCard>
        <VCardTitle class="tw-text-lg tw-font-semibold">
          Mark Multiple Invoices as Paid
        </VCardTitle>
        <VCardText>
          <p class="tw-mb-4">
            Are you sure you want to mark <strong>{{ selected.length }}</strong> invoice(s) as paid?
          </p>
          <p class="tw-text-sm tw-text-gray-600">
            This action will update the invoice statuses and reduce product stock in your inventory for all selected invoices.
          </p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showBulkMarkPaidDialog = false">
            Cancel
          </VBtn>
          <VBtn
            color="success"
            variant="flat"
            @click="executeBulkMarkAsPaid"
            :loading="bulkLoading"
          >
            Mark All as Paid
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

const loading = ref(false)
const invoices = ref<any[]>([])
const selected = ref<any[]>([])
const markingPaid = ref<string | null>(null)
const bulkLoading = ref(false)
const showMarkPaidDialog = ref(false)
const showBulkMarkPaidDialog = ref(false)
const invoiceToMark = ref<any | null>(null)
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

const pagination = reactive({
  page: 1,
  itemsPerPage: 10,
  total: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc' as 'asc' | 'desc'
})

const headers = [
  { title: 'Invoice', key: 'invoiceNumber', sortable: true },
  { title: 'Client', key: 'customerName', sortable: true },
  { title: 'Issued / Due', key: 'dates', sortable: false },
  { title: 'Amount', key: 'total', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
]

interface SummaryMetrics {
  billed: number
  outstanding: number
  sent: number
  clients: number
}

const globalSummary = reactive<SummaryMetrics>({
  billed: 0,
  outstanding: 0,
  sent: 0,
  clients: 0
})

const calculateSummary = (list: any[]): SummaryMetrics => {
  const billed = list.reduce((sum: number, invoice: any) => sum + (Number(invoice.total) || 0), 0)
  const outstanding = list.reduce((sum: number, invoice: any) => {
    const paid = getPaidAmount(invoice)
    return sum + Math.max((Number(invoice.total) || 0) - paid, 0)
  }, 0)
  const sent = list.length
  const clients = new Set(list.map((invoice: any) => invoice.customerEmail)).size

  return { billed, outstanding, sent, clients }
}

let debounceTimer: NodeJS.Timeout | null = null

const debouncedLoad = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    pagination.page = 1
    loadInvoices()
  }, 500)
}

const loadInvoices = async () => {
  loading.value = true
  try {
    const queryParams: any = {
      page: pagination.page,
      itemsPerPage: pagination.itemsPerPage,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder
    }

    if (filters.search) {
      queryParams.search = filters.search
    }
    if (filters.status !== 'all') {
      queryParams.status = filters.status
    }
    if (filters.dateFrom) {
      queryParams.dateFrom = filters.dateFrom
    }
    if (filters.dateTo) {
      queryParams.dateTo = filters.dateTo
    }

    const response = await $fetch<{
      items: any[]
      total: number
      page: number
      itemsPerPage: number
      totalPages: number
    }>('/api/invoices', {
      query: queryParams
    })

    invoices.value = response.items
    pagination.total = response.total

    // Update global summary on first load
    if (pagination.page === 1 && filters.search === '' && filters.status === 'all' && !filters.dateFrom && !filters.dateTo) {
      Object.assign(globalSummary, calculateSummary(response.items))
    }
  } catch (error) {
    console.error('Error fetching invoices:', error)
  } finally {
    loading.value = false
  }
}

const onOptionsUpdate = (options: any) => {
  if (options.page !== undefined) {
    pagination.page = options.page
  }
  if (options.itemsPerPage !== undefined) {
    pagination.itemsPerPage = options.itemsPerPage
  }
  if (options.sortBy && options.sortBy.length > 0) {
    const sort = options.sortBy[0]
    pagination.sortBy = sort.key
    pagination.sortOrder = sort.order || 'desc'
  }
  loadInvoices()
}

const currentSummary = computed<SummaryMetrics>(() => calculateSummary(invoices.value))

const summaryCards = computed(() => {
  const current = currentSummary.value
  const baseline = globalSummary

  const percentChange = (currentValue: number, baseValue: number) => {
    if (baseValue === 0) {
      return currentValue === 0 ? 0 : 100
    }
    return Math.round(((currentValue - baseValue) / baseValue) * 1000) / 10
  }

  return [
    {
      label: 'Total billed',
      value: formatCurrency(current.billed),
      trend: percentChange(current.billed, baseline.billed),
      helper: 'Across all invoices',
      positive: true
    },
    {
      label: 'Outstanding',
      value: formatCurrency(current.outstanding),
      trend: percentChange(current.outstanding, baseline.outstanding),
      helper: 'Awaiting payment',
      positive: false
    },
    {
      label: 'Invoices sent',
      value: current.sent.toString(),
      trend: percentChange(current.sent, baseline.sent),
      helper: 'Active in selection',
      positive: true
    },
    {
      label: 'Clients billed',
      value: current.clients.toString(),
      trend: percentChange(current.clients, baseline.clients),
      helper: 'Unique customers',
      positive: true
    }
  ]
})

function resetFilters() {
  filters.search = ''
  filters.status = 'all'
  filters.dateFrom = ''
  filters.dateTo = ''
  pagination.page = 1
  loadInvoices()
}

function confirmMarkAsPaid(invoice: any) {
  invoiceToMark.value = invoice
  showMarkPaidDialog.value = true
}

async function executeMarkAsPaid() {
  if (!invoiceToMark.value) return
  
  markingPaid.value = invoiceToMark.value._id
  try {
    await $fetch(`/api/invoices/${invoiceToMark.value._id}/pay`, {
      method: 'POST'
    })
    showMarkPaidDialog.value = false
    invoiceToMark.value = null
    await loadInvoices()
  } catch (error) {
    console.error('Failed to mark invoice as paid:', error)
  } finally {
    markingPaid.value = null
  }
}

function confirmBulkMarkAsPaid() {
  if (selected.value.length === 0) return
  showBulkMarkPaidDialog.value = true
}

async function executeBulkMarkAsPaid() {
  if (selected.value.length === 0) return

  bulkLoading.value = true
  try {
    const invoiceIds = selected.value.map((item: any) => item._id || item)
    await $fetch('/api/invoices/bulk-pay', {
      method: 'POST',
      body: { invoiceIds }
    })
    showBulkMarkPaidDialog.value = false
    selected.value = []
    await loadInvoices()
  } catch (error) {
    console.error('Failed to bulk mark invoices as paid:', error)
  } finally {
    bulkLoading.value = false
  }
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

function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'success'
    case 'partial':
      return 'warning'
    case 'sent':
      return 'info'
    case 'cancelled':
      return 'error'
    case 'draft':
    default:
      return 'default'
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

// Helper function to safely get item data from VDataTable item structure
function getItemData(item: any) {
  // In Vuetify 3, item might be the raw data directly, or it might be in item.raw
  return item.raw || item
}

onMounted(() => {
  loadInvoices()
})
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
