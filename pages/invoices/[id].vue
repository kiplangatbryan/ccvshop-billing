<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Loading invoice...</p>
    </div>

    <div v-else-if="invoice" class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Invoice {{ invoice.invoiceNumber }}</h1>
          <p class="mt-2 text-gray-600">
            Created: {{ new Date(invoice.createdAt).toLocaleDateString() }}
          </p>
        </div>
        <div class="flex space-x-3">
          <button
            @click="downloadPDF"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Download PDF
          </button>
          <button
            v-if="invoice.status !== 'paid'"
            @click="markAsPaid"
            :disabled="processingPayment"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <span v-if="processingPayment">Processing...</span>
            <span v-else>Mark as Paid</span>
          </button>
          <button
            @click="openPaymentModal"
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Record Payment
          </button>
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="bg-white shadow rounded-lg p-6">
        <!-- Status -->
        <div class="mb-6">
          <span
            :class="{
              'bg-green-100 text-green-800': invoice.status === 'paid',
              'bg-yellow-100 text-yellow-800': invoice.status === 'sent',
              'bg-gray-100 text-gray-800': invoice.status === 'draft',
              'bg-red-100 text-red-800': invoice.status === 'cancelled'
            }"
            class="inline-flex px-3 py-1 text-sm font-semibold rounded-full"
          >
            {{ invoice.status.toUpperCase() }}
          </span>
        </div>

        <!-- Customer Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Bill To:</h3>
            <p class="text-gray-900 font-medium">{{ invoice.customerName }}</p>
            <p class="text-gray-600">{{ invoice.customerEmail }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Invoice Details:</h3>
            <p class="text-gray-900">Invoice #: {{ invoice.invoiceNumber }}</p>
            <p class="text-gray-600">Date: {{ new Date(invoice.createdAt).toLocaleDateString() }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="border-t border-gray-200 pt-6">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size / Origin
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(item, index) in invoice.items" :key="index">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ item.productName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="font-medium text-gray-700">{{ item.sizeLabel || '-' }}</div>
                  <div class="text-xs text-gray-400">
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.quantity }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${{ item.price.toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${{ item.total.toFixed(2) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="3" class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  Subtotal:
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${{ invoice.subtotal.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td colspan="3" class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  Tax:
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${{ invoice.tax.toFixed(2) }}
                </td>
              </tr>
              <tr>
                <td colspan="3" class="px-6 py-4 text-right text-lg font-bold text-gray-900">
                  Total:
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
                  ${{ invoice.total.toFixed(2) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Payments -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Payments</h2>
            <p class="text-sm text-gray-500">
              Total Paid: ${{ totalPaid.toFixed(2) }} · Outstanding: ${{ Math.max(invoice.total - totalPaid, 0).toFixed(2) }}
            </p>
          </div>
          <button
            @click="openPaymentModal"
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
          >
            Add Payment
          </button>
        </div>
        <div v-if="invoice.payments && invoice.payments.length > 0" class="space-y-3">
          <div
            v-for="(payment, idx) in invoice.payments"
            :key="idx"
            class="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p class="font-medium text-gray-900">${{ payment.amount.toFixed(2) }} · {{ formatPaymentMethod(payment.method) }}</p>
              <p class="text-sm text-gray-500">
                {{ new Date(payment.paidAt).toLocaleDateString() }}
                <span v-if="payment.reference"> · Ref: {{ payment.reference }}</span>
              </p>
              <p v-if="payment.notes" class="text-sm text-gray-400 mt-1">
                {{ payment.notes }}
              </p>
            </div>
            <span class="text-xs text-gray-400">
              Recorded by {{ payment.recordedBy || 'system' }}
            </span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">
          No payments recorded yet.
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <NuxtLink
          to="/invoices"
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back to Invoices
        </NuxtLink>
        <NuxtLink
          :to="`/invoices/${invoice._id}/edit`"
          v-if="invoice.status === 'draft'"
          class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          Edit Invoice
        </NuxtLink>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <p class="text-gray-500">Invoice not found</p>
      <NuxtLink to="/invoices" class="mt-4 text-orange-600 hover:text-orange-500">
        Back to Invoices
      </NuxtLink>
    </div>
  </div>

  <!-- Payment Modal -->
  <div
    v-if="showPaymentModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">Record Payment</h3>
        <button @click="closePaymentModal" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form @submit.prevent="submitPayment" class="px-6 py-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
            <input
              v-model.number="paymentForm.amount"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Method</label>
            <select
              v-model="paymentForm.method"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reference</label>
            <input
              v-model="paymentForm.reference"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
            <input
              v-model="paymentForm.paidAt"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            v-model="paymentForm.notes"
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            @click="closePaymentModal"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="savingPayment"
            class="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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
import { $fetch } from 'ofetch'

declare function definePageMeta(meta: any): void

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()

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
    invoice.value = await $fetch(`/api/invoices/${route.params.id}`)
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
    const html = await $fetch(`/api/invoices/${route.params.id}/pdf`)
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


