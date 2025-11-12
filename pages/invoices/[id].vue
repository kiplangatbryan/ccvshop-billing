<template>
  <div class="tw-max-w-4xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
    <div v-if="loading" class="tw-text-center tw-py-12">
      <p class="tw-text-gray-500">Loading invoice...</p>
    </div>

    <div v-else-if="invoice" class="tw-space-y-6">
      <!-- Header -->
      <div class="tw-flex tw-justify-between tw-items-start">
        <div>
          <h1 class="tw-text-3xl tw-font-bold tw-text-gray-900">Invoice {{ invoice.invoiceNumber }}</h1>
          <p class="tw-mt-2 tw-text-gray-600">
            Created: {{ new Date(invoice.createdAt).toLocaleDateString() }}
          </p>
        </div>
        <div class="tw-flex tw-space-x-3">
          <button
            @click="downloadPDF"
            class="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-gray-700 hover:tw-bg-gray-50"
          >
            Download PDF
          </button>
          <button
            v-if="invoice.status !== 'paid'"
            @click="markAsPaid"
            :disabled="processingPayment"
            class="tw-px-4 tw-py-2 tw-bg-green-600 tw-text-white tw-rounded-lg hover:tw-bg-green-700 disabled:tw-opacity-50"
          >
            <span v-if="processingPayment">Processing...</span>
            <span v-else>Mark as Paid</span>
          </button>
          <button
            @click="openPaymentModal"
            class="tw-px-4 tw-py-2 tw-bg-orange-600 tw-text-white tw-rounded-lg hover:tw-bg-orange-700"
          >
            Record Payment
          </button>
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="tw-bg-white tw-shadow tw-rounded-lg tw-p-6">
        <!-- Status -->
        <div class="tw-mb-6">
          <span
            :class="{
              'tw-bg-green-100 tw-text-green-800': invoice.status === 'paid',
              'tw-bg-yellow-100 tw-text-yellow-800': invoice.status === 'sent',
              'tw-bg-gray-100 tw-text-gray-800': invoice.status === 'draft',
              'tw-bg-red-100 tw-text-red-800': invoice.status === 'cancelled'
            }"
            class="tw-inline-flex tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-rounded-full"
          >
            {{ invoice.status.toUpperCase() }}
          </span>
        </div>

        <!-- Customer Info -->
        <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-mb-6">
          <div>
            <h3 class="tw-text-sm tw-font-medium tw-text-gray-500 tw-mb-2">Bill To:</h3>
            <p class="tw-text-gray-900 tw-font-medium">{{ invoice.customerName }}</p>
            <p class="tw-text-gray-600">{{ invoice.customerEmail }}</p>
          </div>
          <div>
            <h3 class="tw-text-sm tw-font-medium tw-text-gray-500 tw-mb-2">Invoice Details:</h3>
            <p class="tw-text-gray-900">Invoice #: {{ invoice.invoiceNumber }}</p>
            <p class="tw-text-gray-600">Date: {{ new Date(invoice.createdAt).toLocaleDateString() }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="tw-border-t tw-border-gray-200 tw-pt-6">
          <table class="tw-min-w-full tw-divide-y tw-divide-gray-200">
            <thead class="tw-bg-gray-50">
              <tr>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Product
                </th>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Size / Origin
                </th>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Quantity
                </th>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Price
                </th>
                <th class="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody class="tw-bg-white tw-divide-y tw-divide-gray-200">
              <tr v-for="(item, index) in invoice.items" :key="index">
                <td class="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-gray-900">
                  {{ item.productName }}
                </td>
                <td class="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                  <div class="tw-font-medium tw-text-gray-700">{{ item.sizeLabel || '-' }}</div>
                  <div class="tw-text-xs tw-text-gray-400">
                    <span v-if="item.length">L: {{ item.length }}m</span>
                    <span v-if="item.width">
                      <span v-if="item.length"> · </span>
                      W: {{ item.width }}m
                    </span>
                    <span v-if="item.origin">
                      <span v-if="item.length || item.width"> · </span>
                      {{ item.origin }}
                    </span>
                  </div>
                </td>
                <td class="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                  {{ item.quantity }}
                </td>
                <td class="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                  ${{ item.price.toFixed(2) }}
                </td>
                <td class="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-900">
                  ${{ item.total.toFixed(2) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="tw-bg-gray-50">
              <tr>
                <td colspan="3" class="tw-px-6 tw-py-4 tw-text-right tw-text-sm tw-font-medium tw-text-gray-900">
                  Subtotal:
                </td>
                <td class="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-gray-900">
                  ${{ invoice.subtotal.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td colspan="3" class="tw-px-6 tw-py-4 tw-text-right tw-text-sm tw-font-medium tw-text-gray-900">
                  Tax:
                </td>
                <td class="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-gray-900">
                  ${{ invoice.tax.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td colspan="3" class="tw-px-6 tw-py-4 tw-text-right tw-text-lg tw-font-bold tw-text-gray-900">
                  Total:
                </td>
                <td class="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-lg tw-font-bold tw-text-gray-900">
                  ${{ invoice.total.toFixed(2) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Payments -->
      <div class="tw-bg-white tw-shadow tw-rounded-lg tw-p-6">
        <div class="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-gray-200 tw-pb-4 tw-mb-4">
          <div>
            <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Payments</h2>
            <p class="tw-text-sm tw-text-gray-500">
              Total Paid: ${{ totalPaid.toFixed(2) }} · Outstanding: ${{ Math.max(invoice.total - totalPaid, 0).toFixed(2) }}
            </p>
          </div>
          <button
            @click="openPaymentModal"
            class="tw-px-4 tw-py-2 tw-bg-orange-600 tw-text-white tw-rounded-lg hover:tw-bg-orange-700 tw-text-sm"
          >
            Add Payment
          </button>
        </div>
        <div v-if="invoice.payments && invoice.payments.length > 0" class="tw-space-y-3">
          <div
            v-for="(payment, idx) in invoice.payments"
            :key="idx"
            class="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-flex tw-justify-between tw-items-center"
          >
            <div>
              <p class="tw-font-medium tw-text-gray-900">
                ${{ payment.amount.toFixed(2) }} · {{ formatPaymentMethod(payment.method) }}
              </p>
              <p class="tw-text-sm tw-text-gray-500">
                {{ new Date(payment.paidAt).toLocaleDateString() }}
                <span v-if="payment.reference"> · Ref: {{ payment.reference }}</span>
              </p>
              <p v-if="payment.notes" class="tw-text-sm tw-text-gray-400 tw-mt-1">
                {{ payment.notes }}
              </p>
            </div>
            <span class="tw-text-xs tw-text-gray-400">
              Recorded by {{ payment.recordedBy || 'system' }}
            </span>
          </div>
        </div>
        <div v-else class="tw-text-sm tw-text-gray-500">
          No payments recorded yet.
        </div>
      </div>

      <!-- Actions -->
      <div class="tw-flex tw-justify-end tw-space-x-3">
        <NuxtLink
          to="/invoices"
          class="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-gray-700 hover:tw-bg-gray-50"
        >
          Back to Invoices
        </NuxtLink>
        <NuxtLink
          :to="`/invoices/${invoice._id}/edit`"
          v-if="invoice.status === 'draft'"
          class="tw-px-4 tw-py-2 tw-bg-orange-600 tw-text-white tw-rounded-lg hover:tw-bg-orange-700"
        >
          Edit Invoice
        </NuxtLink>
      </div>
    </div>

    <div v-else class="tw-text-center tw-py-12">
      <p class="tw-text-gray-500">Invoice not found</p>
      <NuxtLink to="/invoices" class="tw-mt-4 tw-text-orange-600 hover:tw-text-orange-500">
        Back to Invoices
      </NuxtLink>
    </div>
  </div>

  <!-- Payment Modal -->
  <div
    v-if="showPaymentModal"
    class="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50"
  >
    <div class="tw-bg-white tw-rounded-lg tw-shadow-xl tw-max-w-lg tw-w-full">
      <div class="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200 tw-flex tw-justify-between tw-items-center">
        <h3 class="tw-text-lg tw-font-semibold tw-text-gray-900">Record Payment</h3>
        <button @click="closePaymentModal" class="tw-text-gray-400 hover:tw-text-gray-600">
          <svg class="tw-w-6 tw-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form @submit.prevent="submitPayment" class="tw-px-6 tw-py-4 tw-space-y-4">
        <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          <div>
            <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Amount *</label>
            <input
              v-model.number="paymentForm.amount"
              type="number"
              min="0"
              step="0.01"
              required
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            />
          </div>
          <div>
            <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Method</label>
            <select
              v-model="paymentForm.method"
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Reference</label>
            <input
              v-model="paymentForm.reference"
              type="text"
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            />
          </div>
          <div>
            <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Payment Date</label>
            <input
              v-model="paymentForm.paidAt"
              type="date"
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            />
          </div>
        </div>
        <div>
          <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Notes</label>
          <textarea
            v-model="paymentForm.notes"
            rows="3"
            class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
          />
        </div>
        <div class="tw-flex tw-justify-end tw-space-x-3 tw-pt-4 tw-border-t">
          <button
            type="button"
            @click="closePaymentModal"
            class="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-gray-700 hover:tw-bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="savingPayment"
            class="tw-px-6 tw-py-2 tw-bg-orange-600 tw-text-white tw-rounded-lg hover:tw-bg-orange-700 disabled:tw-opacity-50"
          >
            <span v-if="savingPayment">Saving...</span>
            <span v-else>Save Payment</span>
          </button>
        </div>
      </form>
    </div>
  </div>
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

const totalPaid = computed(() => {
  if (!invoice.value?.payments) return 0
  return invoice.value.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
})

const downloadPDF = async () => {
  try {
    const html = await $fetch<string>(`/api/invoices/${route.params.id}/pdf`)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Failed to generate PDF')
  }
}

const openPaymentModal = () => {
  showPaymentModal.value = true
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


