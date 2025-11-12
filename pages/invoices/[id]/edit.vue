<template>
  <div class="tw-max-w-4xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
    <div class="tw-mb-8">
      <h1 class="tw-text-3xl tw-font-bold tw-text-gray-900">Edit Invoice</h1>
      <p class="tw-mt-2 tw-text-gray-600">Update invoice details, carpet specifications, and line items.</p>
    </div>

    <div v-if="loading" class="tw-bg-white tw-shadow tw-rounded-lg tw-p-6 tw-text-center">
      <p class="tw-text-gray-500">Loading invoice...</p>
    </div>

    <form
      v-else
      @submit.prevent="handleSubmit"
      class="tw-bg-white tw-shadow tw-rounded-lg tw-p-6 tw-space-y-6"
    >
      <!-- Customer Information -->
      <section>
        <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">Customer Information</h2>
        <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          <div>
            <label for="invoiceNumber" class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Invoice Number *
            </label>
            <input
              id="invoiceNumber"
              v-model="form.invoiceNumber"
              type="text"
              required
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            />
          </div>
          <div>
            <label for="status" class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Status
            </label>
            <select
              id="status"
              v-model="form.status"
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label for="customerName" class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Customer Name *
            </label>
            <input
              id="customerName"
              v-model="form.customerName"
              type="text"
              required
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            />
          </div>
          <div>
            <label for="customerEmail" class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Customer Email *
            </label>
            <input
              id="customerEmail"
              v-model="form.customerEmail"
              type="email"
              required
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            />
          </div>
          <div>
            <label for="tax" class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Tax Rate (%)
            </label>
            <input
              id="tax"
              v-model.number="form.tax"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
            />
          </div>
        </div>
      </section>

      <!-- Line Items -->
      <section>
        <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Carpet Line Items</h2>
          <button
            type="button"
            @click="addEmptyItem"
            class="tw-text-sm tw-text-orange-600 hover:tw-text-orange-500 tw-font-medium"
          >
            + Add Custom Item
          </button>
        </div>

        <div
          v-if="form.items.length === 0"
          class="tw-border-2 tw-border-dashed tw-border-gray-300 tw-rounded-lg tw-py-10 tw-text-center"
        >
          <p class="tw-text-gray-500 tw-mb-2">No items on this invoice yet.</p>
          <button
            type="button"
            @click="addEmptyItem"
            class="tw-text-orange-600 hover:tw-text-orange-500 tw-font-medium"
          >
            Add your first item →
          </button>
        </div>

        <div v-else class="tw-space-y-4">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-4"
          >
            <div class="tw-flex tw-justify-between tw-items-start">
              <div class="tw-flex-1 tw-pr-4">
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Product Name *</label>
                <input
                  v-model="item.productName"
                  type="text"
                  required
                  class="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
                />
              </div>
              <button
                type="button"
                class="tw-text-red-600 hover:tw-text-red-500 tw-text-sm tw-font-medium"
                @click="removeItem(index)"
              >
                Remove
              </button>
            </div>

            <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Quantity *</label>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                  required
                  class="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
                />
              </div>
              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Price *</label>
                <input
                  v-model.number="item.price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
                />
              </div>
              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Size Label</label>
                <input
                  v-model="item.sizeLabel"
                  type="text"
                  placeholder="e.g. 8x10"
                  class="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
                />
              </div>
            </div>

            <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Length (m)</label>
                <input
                  v-model.number="item.length"
                  type="number"
                  min="0"
                  step="0.01"
                  class="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
                />
              </div>
              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Width (m)</label>
                <input
                  v-model.number="item.width"
                  type="number"
                  min="0"
                  step="0.01"
                  class="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
                />
              </div>
              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Origin</label>
                <input
                  v-model="item.origin"
                  type="text"
                  placeholder="e.g. Persian"
                  class="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-orange-500 focus:tw-border-orange-500"
                />
              </div>
            </div>

            <div class="tw-text-right tw-text-sm tw-text-gray-600">
              Line Total:
              <span class="tw-font-semibold tw-text-gray-900">{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Totals -->
      <section class="tw-border-t tw-pt-4 tw-space-y-2">
        <div class="tw-flex tw-justify-between tw-text-sm">
          <span class="tw-text-gray-600">Subtotal:</span>
          <span class="tw-text-gray-900">{{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="tw-flex tw-justify-between tw-text-sm">
          <span class="tw-text-gray-600">Tax ({{ form.tax }}%):</span>
          <span class="tw-text-gray-900">{{ taxAmount.toFixed(2) }}</span>
        </div>
        <div class="tw-flex tw-justify-between tw-text-lg tw-font-semibold tw-border-t tw-pt-2 tw-mt-2">
          <span>Total:</span>
          <span>{{ total.toFixed(2) }}</span>
        </div>
      </section>

      <!-- Actions -->
      <div class="tw-flex tw-justify-between tw-items-center tw-pt-4 tw-border-t">
        <NuxtLink
          :to="`/invoices/${route.params.id}`"
          class="tw-text-sm tw-text-gray-500 hover:tw-text-gray-700"
        >
          ← Back to invoice
        </NuxtLink>

        <div class="tw-flex tw-space-x-4">
          <NuxtLink
            to="/invoices"
            class="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-gray-700 hover:tw-bg-gray-50"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="saving || form.items.length === 0"
            class="tw-px-6 tw-py-2 tw-bg-orange-600 tw-text-white tw-rounded-lg hover:tw-bg-orange-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
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
import { useRoute, useRouter } from 'nuxt/app'

declare function definePageMeta(meta: any): void

const $fetch = useRequestFetch()

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
    const invoice = await $fetch<any>(`/api/invoices/${route.params.id}`)
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


