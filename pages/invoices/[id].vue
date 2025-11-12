<template>
  <div class="tw-max-w-4xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
    <div v-if="loading" class="tw-text-center tw-py-12">
      <p class="tw-text-gray-500">Loading invoice...</p>
    </div>

    <div v-else-if="invoice" class="tw-space-y-6">
      <div class="tw-flex tw-flex-wrap tw-justify-between tw-items-start tw-gap-4">
        <div>
          <h1 class="tw-text-3xl tw-font-bold tw-text-gray-900">Invoice {{ invoice.invoiceNumber }}</h1>
          <p class="tw-mt-2 tw-text-gray-600">
            Created: {{ formatDate(invoice.createdAt) }}<span v-if="invoice.dueDate"> · Due: {{ formatDate(invoice.dueDate) }}</span>
          </p>
        </div>
        <div class="tw-flex tw-flex-wrap tw-gap-3">
          <VBtn variant="tonal" color="primary" @click="downloadPDF" prepend-icon="mdi-download">
            Download PDF
          </VBtn>
          <VBtn
            v-if="invoice.status !== 'paid'"
            color="success"
            @click="markAsPaid"
            :loading="processingPayment"
            :disabled="processingPayment"
          >
            Mark as Paid
          </VBtn>
          <VBtn color="secondary" variant="tonal" @click="showPaymentModal = true">
            Record Payment
          </VBtn>
        </div>
      </div>

      <VSheet class="tw-bg-white tw-shadow tw-rounded-lg tw-p-6 tw-space-y-6">
        <div>
          <VChip
            size="small"
            :color="statusColor"
            variant="flat"
            class="tw-uppercase tw-font-semibold"
          >
            {{ invoice.status }}
          </VChip>
        </div>

        <div class="tw-grid md:tw-grid-cols-2 tw-gap-6">
          <div class="tw-space-y-2">
            <h3 class="tw-text-sm tw-font-semibold tw-text-gray-500">Bill To</h3>
            <p class="tw-font-medium tw-text-gray-900">{{ invoice.customerName }}</p>
            <p class="tw-text-sm tw-text-gray-600">{{ invoice.customerEmail }}</p>
          </div>
          <div class="tw-space-y-2">
            <h3 class="tw-text-sm tw-font-semibold tw-text-gray-500">Invoice Details</h3>
            <div class="tw-text-sm tw-text-gray-700">Invoice #: <span class="tw-font-medium">{{ invoice.invoiceNumber }}</span></div>
            <div class="tw-text-sm tw-text-gray-700">Date: <span class="tw-font-medium">{{ formatDate(invoice.createdAt) }}</span></div>
            <div class="tw-text-sm tw-text-gray-700">Due Date: <span class="tw-font-medium">{{ formatDate(invoice.dueDate) }}</span></div>
          </div>
        </div>

        <div class="tw-border-t tw-border-gray-200 tw-pt-6">
          <table class="tw-min-w-full tw-divide-y tw-divide-gray-200">
            <thead class="tw-bg-gray-50">
              <tr>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Description
                </th>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Area (m²)
                </th>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Quantity
                </th>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Rate
                </th>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody class="tw-bg-white tw-divide-y tw-divide-gray-200">
              <tr v-for="(item, index) in invoice.items" :key="index">
                <td class="tw-px-6 tw-py-4 tw-align-top">
                  <div class="tw-font-medium tw-text-gray-900">{{ item.productName }}</div>
                  <div v-if="item.description" class="tw-text-xs tw-text-gray-500 tw-mt-1">{{ item.description }}</div>
                  <div class="tw-text-xs tw-text-gray-400 tw-mt-1">
                    <span v-if="item.sizeLabel">{{ item.sizeLabel }}</span>
                    <span v-if="item.length">{{ item.length }}m</span>
                    <span v-if="item.width">× {{ item.width }}m</span>
                    <span v-if="item.origin">• {{ item.origin }}</span>
                  </div>
                </td>
                <td class="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">
                  {{ formatArea(item.area) }}
                </td>
                <td class="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">
                  {{ item.quantity }}
                </td>
                <td class="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">
                  {{ formatCurrency(item.price) }}
                </td>
                <td class="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-900 tw-font-semibold">
                  {{ formatCurrency(item.total) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="tw-flex tw-flex-col md:tw-flex-row tw-gap-6 tw-justify-between tw-pt-4">
          <div class="tw-text-sm tw-text-gray-600">
            <div v-if="invoice.memo" class="tw-mb-2">
              <p class="tw-font-semibold tw-text-gray-700">Notes</p>
              <p>{{ invoice.memo }}</p>
            </div>
            <div v-if="invoice.terms" class="tw-text-sm tw-text-gray-600">
              <p class="tw-font-semibold tw-text-gray-700">Terms</p>
              <p>{{ invoice.terms }}</p>
            </div>
          </div>
          <div class="tw-min-w-[260px]">
            <table class="tw-w-full tw-text-sm">
              <tbody class="tw-text-gray-700">
                <tr>
                  <td class="tw-py-1 tw-text-left">Subtotal</td>
                  <td class="tw-py-1 tw-text-right tw-font-medium">{{ formatCurrency(invoice.subtotal) }}</td>
                </tr>
                <tr v-if="invoice.discountAmount && invoice.discountAmount > 0">
                  <td class="tw-py-1 tw-text-left">Discount</td>
                  <td class="tw-py-1 tw-text-right tw-text-emerald-600">-{{ formatCurrency(invoice.discountAmount) }}</td>
                </tr>
                <tr>
                  <td class="tw-py-1 tw-text-left">Tax ({{ (invoice.taxRate || 0).toFixed(2) }}%)</td>
                  <td class="tw-py-1 tw-text-right">{{ formatCurrency(invoice.tax) }}</td>
                </tr>
                <tr>
                  <td class="tw-pt-3 tw-text-left tw-font-semibold tw-text-lg">Total</td>
                  <td class="tw-pt-3 tw-text-right tw-font-semibold tw-text-lg">{{ formatCurrency(invoice.total) }}</td>
                </tr>
                <tr>
                  <td class="tw-pt-2 tw-text-left tw-font-semibold tw-text-base">Balance Due</td>
                  <td class="tw-pt-2 tw-text-right tw-font-semibold tw-text-base tw-text-rose-600">
                    {{ formatCurrency(outstanding) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </VSheet>

      <VSheet class="tw-bg-white tw-shadow tw-rounded-lg tw-p-6 tw-space-y-4">
        <div class="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-gray-200 tw-pb-4">
          <div>
            <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Payments</h2>
            <p class="tw-text-sm tw-text-gray-500">
              Total Paid: {{ formatCurrency(totalPaid) }} · Outstanding: {{ formatCurrency(outstanding) }}
            </p>
          </div>
          <VBtn color="secondary" variant="tonal" @click="showPaymentModal = true" prepend-icon="mdi-plus">
            Add Payment
          </VBtn>
        </div>
        <div v-if="invoice.payments?.length" class="tw-space-y-3">
          <VCard
            v-for="(payment, idx) in invoice.payments"
            :key="idx"
            variant="flat"
            class="tw-border tw-border-gray-200 tw-rounded-lg"
          >
            <VCardText class="tw-flex tw-justify-between tw-items-center tw-gap-4">
              <div>
                <p class="tw-font-medium tw-text-gray-900">{{ formatCurrency(payment.amount) }} · {{ formatPaymentMethod(payment.method) }}</p>
                <p class="tw-text-sm tw-text-gray-500">
                  {{ formatDate(payment.paidAt) }}<span v-if="payment.reference"> · Ref: {{ payment.reference }}</span>
                </p>
                <p v-if="payment.notes" class="tw-text-sm tw-text-gray-400 tw-mt-1">
                  {{ payment.notes }}
                </p>
              </div>
              <span class="tw-text-xs tw-text-gray-400">
                Recorded by {{ payment.recordedBy || 'system' }}
              </span>
            </VCardText>
          </VCard>
        </div>
        <div v-else class="tw-text-sm tw-text-gray-500">
          No payments recorded yet.
        </div>
      </VSheet>

      <div class="tw-flex tw-justify-end tw-gap-3">
        <VBtn variant="text" color="secondary" to="/invoices">Back to Invoices</VBtn>
        <VBtn
          v-if="invoice.status === 'draft'"
          color="primary"
          :to="`/invoices/${invoice._id}/edit`"
        >
          Edit Invoice
        </VBtn>
      </div>
    </div>

    <div v-else class="tw-text-center tw-py-12">
      <p class="tw-text-gray-500">Invoice not found</p>
      <NuxtLink to="/invoices" class="tw-mt-4 tw-text-orange-600 hover:tw-text-orange-500">
        Back to Invoices
      </NuxtLink>
    </div>
  </div>

  <VDialog v-model="showPaymentModal" max-width="640" transition="dialog-bottom-transition">
    <VCard class="tw-rounded-[32px] tw-border tw-border-gray-100 tw-shadow-2xl tw-overflow-hidden">
      <VForm @submit.prevent="submitPayment">
        <VCardText class="tw-pt-6 tw-px-6 tw-space-y-6">
          <div class="tw-flex tw-items-start tw-gap-3">
            <div class="tw-h-11 tw-w-11 tw-rounded-full tw-bg-primary/10 tw-flex tw-items-center tw-justify-center">
              <VIcon color="primary">mdi-cash-plus</VIcon>
            </div>
            <div class="tw-flex-1 tw-space-y-1">
              <h3 class="tw-text-xl tw-font-semibold tw-text-gray-900">Record Payment</h3>
              <p class="tw-text-sm tw-text-gray-500">
                Outstanding balance: <span class="tw-font-semibold tw-text-gray-900">{{ formatCurrency(outstanding) }}</span>
              </p>
            </div>
            <VBtn icon="mdi-close" variant="text" color="primary" @click="closePaymentModal" />
          </div>

          <VRow>
            <VCol cols="12" md="6">
              <VTextField
                v-model.number="paymentForm.amount"
                label="Amount"
                type="number"
                min="0"
                step="0.01"
                variant="outlined"
                rounded="xl"
                density="comfortable"
                color="primary"
                prepend-inner-icon="mdi-cash"
                required
              />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect
                v-model="paymentForm.method"
                :items="paymentMethods"
                item-title="label"
                item-value="value"
                label="Method"
                variant="outlined"
                rounded="xl"
                density="comfortable"
                color="primary"
                prepend-inner-icon="mdi-bank"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="paymentForm.reference"
                label="Reference"
                variant="outlined"
                rounded="xl"
                density="comfortable"
                color="primary"
                prepend-inner-icon="mdi-pound"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="paymentForm.paidAt"
                label="Payment Date"
                type="date"
                variant="outlined"
                rounded="xl"
                density="comfortable"
                color="primary"
                prepend-inner-icon="mdi-calendar"
              />
            </VCol>
          </VRow>
          <VTextarea
            v-model="paymentForm.notes"
            label="Notes"
            rows="3"
            auto-grow
            variant="outlined"
            rounded="xl"
            density="comfortable"
            color="primary"
            prepend-inner-icon="mdi-note-text"
          />
        </VCardText>
        <VCardActions class="tw-px-6 tw-pb-6 tw-pt-2 tw-justify-end tw-gap-3">
          <VBtn variant="outlined" color="secondary" class="tw-rounded-full tw-px-6" @click="closePaymentModal">
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            type="submit"
            class="tw-rounded-full tw-px-6 tw-font-semibold"
            :loading="savingPayment"
            :disabled="savingPayment"
          >
            Save Payment
          </VBtn>
        </VCardActions>
      </VForm>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'nuxt/app'

declare function definePageMeta(meta: any): void

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const $fetch = useRequestFetch()

const invoice = ref<any>(null)
const loading = ref(true)
const processingPayment = ref(false)
const showPaymentModal = ref(false)
const savingPayment = ref(false)
const paymentForm = reactive({
  amount: null as number | null,
  method: 'bank_transfer',
  reference: '',
  notes: '',
  paidAt: ''
})

const paymentMethods = [
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Other', value: 'other' }
]

onMounted(async () => {
  await loadInvoice()
})

const loadInvoice = async () => {
  try {
    invoice.value = await $fetch<any>(`/api/invoices/${route.params.id}`)
  } catch (error) {
    console.error('Error loading invoice:', error)
  } finally {
    loading.value = false
  }
}

const currencyCode = computed(() => invoice.value?.currency || 'USD')

const totalPaid = computed(() => {
  if (!invoice.value?.payments) return 0
  return invoice.value.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
})

const outstanding = computed(() => {
  if (!invoice.value) return 0
  return Math.max(invoice.value.total - totalPaid.value, 0)
})

const statusColor = computed(() => {
  switch (invoice.value?.status) {
    case 'paid':
      return 'green'
    case 'sent':
      return 'blue'
    case 'cancelled':
      return 'red'
    default:
      return 'grey'
  }
})

const downloadPDF = async () => {
  if (!invoice.value) return
  try {
    const buffer = await $fetch<ArrayBuffer>(`/api/invoices/${route.params.id}/pdf`, {
      responseType: 'arrayBuffer'
    })
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoice.value.invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Failed to generate PDF')
  }
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  paymentForm.amount = null
  paymentForm.method = 'bank_transfer'
  paymentForm.reference = ''
  paymentForm.notes = ''
  paymentForm.paidAt = ''
}

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return 'Bank Transfer'
    case 'cash':
      return 'Cash'
    case 'card':
      return 'Card'
    case 'cheque':
      return 'Cheque'
    default:
      return 'Other'
  }
}

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode.value }).format(value || 0)
  } catch (error) {
    console.warn('Currency formatting failed', error)
    return `$${Number(value || 0).toFixed(2)}`
  }
}

const formatDate = (value?: string | Date) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

const formatArea = (value?: number) => {
  if (!value || value <= 0) return '—'
  return `${value.toFixed(2)}`
}

const submitPayment = async () => {
  if (!paymentForm.amount || paymentForm.amount <= 0) {
    alert('Payment amount must be greater than zero.')
    return
  }

  savingPayment.value = true
  try {
    await $fetch(`/api/invoices/${route.params.id}/payments`, {
      method: 'POST',
      body: {
        amount: paymentForm.amount,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
        paidAt: paymentForm.paidAt || undefined
      }
    })
    await loadInvoice()
    closePaymentModal()
  } catch (error: any) {
    alert(error.data?.message || 'Failed to record payment')
  } finally {
    savingPayment.value = false
  }
}

const markAsPaid = async () => {
  if (!confirm('Mark this invoice as paid? This will update product quantities in CCV Shop.')) {
    return
  }

  processingPayment.value = true
  try {
    await $fetch(`/api/invoices/${route.params.id}/pay`, {
      method: 'POST'
    })
    await loadInvoice()
    alert('Invoice marked as paid and inventory updated successfully!')
  } catch (error: any) {
    alert(error.data?.message || 'Failed to process payment')
  } finally {
    processingPayment.value = false
  }
}
</script>


