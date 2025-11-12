<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Edit Invoice</h1>
      <p class="mt-2 text-gray-600">Update invoice details, carpet specifications, and line items.</p>
    </div>

    <div v-if="loading" class="bg-white shadow rounded-lg p-6 text-center">
      <p class="text-gray-500">Loading invoice...</p>
    </div>

    <form
      v-else
      @submit.prevent="handleSubmit"
      class="bg-white shadow rounded-lg p-6 space-y-6"
    >
      <!-- Customer Information -->
      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="invoiceNumber" class="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number *
            </label>
            <input
              id="invoiceNumber"
              v-model="form.invoiceNumber"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              v-model="form.status"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label for="customerName" class="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              id="customerName"
              v-model="form.customerName"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label for="customerEmail" class="block text-sm font-medium text-gray-700 mb-2">
              Customer Email *
            </label>
            <input
              id="customerEmail"
              v-model="form.customerEmail"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label for="tax" class="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input
              id="tax"
              v-model.number="form.tax"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </section>

      <!-- Line Items -->
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Carpet Line Items</h2>
          <button
            type="button"
            @click="addEmptyItem"
            class="text-sm text-orange-600 hover:text-orange-500 font-medium"
          >
            + Add Custom Item
          </button>
        </div>

        <div v-if="form.items.length === 0" class="border-2 border-dashed border-gray-300 rounded-lg py-10 text-center">
          <p class="text-gray-500 mb-2">No items on this invoice yet.</p>
          <button
            type="button"
            @click="addEmptyItem"
            class="text-orange-600 hover:text-orange-500 font-medium"
          >
            Add your first item →
          </button>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="border border-gray-200 rounded-lg p-4 space-y-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1 pr-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  v-model="item.productName"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <button
                type="button"
                class="text-red-600 hover:text-red-500 text-sm font-medium"
                @click="removeItem(index)"
              >
                Remove
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                <input
                  v-model.number="item.price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Size Label</label>
                <input
                  v-model="item.sizeLabel"
                  type="text"
                  placeholder="e.g. 8x10"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Length (m)</label>
                <input
                  v-model.number="item.length"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Width (m)</label>
                <input
                  v-model.number="item.width"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                <input
                  v-model="item.origin"
                  type="text"
                  placeholder="e.g. Persian"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div class="text-right text-sm text-gray-600">
              Line Total: <span class="font-semibold text-gray-900">${{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Totals -->
      <section class="border-t pt-4 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Subtotal:</span>
          <span class="text-gray-900">${{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Tax ({{ form.tax }}%):</span>
          <span class="text-gray-900">${{ taxAmount.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
          <span>Total:</span>
          <span>${{ total.toFixed(2) }}</span>
        </div>
      </section>

      <!-- Actions -->
      <div class="flex justify-between items-center pt-4 border-t">
        <NuxtLink
          :to="`/invoices/${route.params.id}`"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to invoice
        </NuxtLink>

        <div class="flex space-x-4">
          <NuxtLink
            to="/invoices"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="saving || form.items.length === 0"
            class="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, useNuxtApp } from 'nuxt/app'

declare function definePageMeta(meta: any): void

const nuxtApp = useNuxtApp()
const $fetch = nuxtApp.$fetch as any

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const form = ref({
  invoiceNumber: '',
  customerName: '',
  customerEmail: '',
  tax: 0,
  status: 'draft',
  items: [] as Array<{
    productId: string
    productName: string
    quantity: number
    price: number
    sizeLabel?: string | null
    length?: number | null
    width?: number | null
    origin?: string | null
  }>
})

onMounted(async () => {
  await loadInvoice()
})

const loadInvoice = async () => {
  loading.value = true
  try {
    const invoice = await $fetch(`/api/invoices/${route.params.id}`)
    form.value.invoiceNumber = invoice.invoiceNumber
    form.value.customerName = invoice.customerName
    form.value.customerEmail = invoice.customerEmail
    const inferredTaxRate =
      invoice.subtotal > 0 ? (invoice.tax / invoice.subtotal) * 100 : 0
    form.value.tax = Number(inferredTaxRate.toFixed(2))
    form.value.status = invoice.status

    form.value.items = invoice.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      sizeLabel: item.sizeLabel ?? null,
      length: item.length ?? null,
      width: item.width ?? null,
      origin: item.origin ?? null
    }))
  } catch (error) {
    console.error('Failed to load invoice:', error)
    alert('Unable to load this invoice.')
    router.push('/invoices')
  } finally {
    loading.value = false
  }
}

const subtotal = computed(() => {
  return form.value.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const taxAmount = computed(() => {
  return subtotal.value * (form.value.tax / 100)
})

const total = computed(() => subtotal.value + taxAmount.value)

const addEmptyItem = () => {
  form.value.items.push({
    productId: crypto.randomUUID(),
    productName: '',
    quantity: 1,
    price: 0,
    sizeLabel: '',
    length: null,
    width: null,
    origin: ''
  })
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const normaliseItemsForPayload = () => {
  return form.value.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    sizeLabel: item.sizeLabel || undefined,
    length: item.length ?? undefined,
    width: item.width ?? undefined,
    origin: item.origin || undefined,
    total: Number((item.price * item.quantity).toFixed(2))
  }))
}

const handleSubmit = async () => {
  if (form.value.items.length === 0) {
    alert('Add at least one line item.')
    return
  }

  saving.value = true

  try {
    await $fetch(`/api/invoices/${route.params.id}`, {
      method: 'PUT',
      body: {
        invoiceNumber: form.value.invoiceNumber,
        customerName: form.value.customerName,
        customerEmail: form.value.customerEmail,
        tax: form.value.tax,
        status: form.value.status,
        items: normaliseItemsForPayload()
      }
    })

    await router.push(`/invoices/${route.params.id}`)
  } catch (error: any) {
    console.error('Failed to update invoice:', error)
    alert(error.data?.message || 'Failed to update invoice')
  } finally {
    saving.value = false
  }
}
</script>


