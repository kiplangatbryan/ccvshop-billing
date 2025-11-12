<template>
  <div class="page-shell space-y-8">
    <div class="page-header">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-[#22c55e]">Create</p>
        <h1>New Invoice</h1>
        <p class="text-gray-500 mt-2">Capture client details, line items, and payment expectations while previewing the final invoice in real time.</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <button type="button" class="btn btn-ghost" @click="prefillDemo()">Load sample data</button>
        <button type="button" class="btn btn-ghost" @click="saveDraft">Save draft</button>
        <button type="button" class="btn btn-primary" @click="submitInvoice(true)" :disabled="submitting || disabledSubmit">
          <span v-if="submitting">Sending...</span>
          <span v-else>Save &amp; send</span>
        </button>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.85fr,1fr]">
      <form @submit.prevent class="space-y-5">
        <section class="card-shell space-y-5">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Invoice information</h2>
            <p class="text-sm text-gray-500">Reference details shown on the invoice header.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Invoice number *</label>
              <input v-model="form.invoiceNumber" type="text" required class="input-control" placeholder="INV-100045" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Currency</label>
              <select v-model="form.currency" class="input-control">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Tax rate (%)</label>
              <input v-model.number="form.taxRate" type="number" min="0" step="0.1" class="input-control" placeholder="0" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Invoice date</label>
              <input v-model="form.invoiceDate" type="date" class="input-control" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Due date</label>
              <input v-model="form.dueDate" type="date" class="input-control" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Payment terms</label>
              <input v-model="form.terms" type="text" class="input-control" placeholder="Net 30" />
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Memo (visible to client)</label>
            <textarea v-model="form.memo" rows="3" class="input-control" placeholder="Thank you for your business. Please include invoice number with payment." />
          </div>
        </section>

        <section class="card-shell space-y-5">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Bill to</h2>
            <p class="text-sm text-gray-500">Specify who will receive this invoice.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Client name *</label>
              <input v-model="form.customerName" type="text" required class="input-control" placeholder="Acme Corporation" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Client email *</label>
              <input v-model="form.customerEmail" type="email" required class="input-control" placeholder="billing@acme.com" />
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Client address</label>
              <textarea v-model="form.customerAddress" rows="3" class="input-control" placeholder="Street, City, Country" />
            </div>
          </div>
        </section>

        <section class="card-shell space-y-5">
          <div class="flex items-center justify-between">
          <div>
              <h2 class="text-lg font-semibold text-gray-900">Carpet defaults</h2>
              <p class="text-sm text-gray-500">Prefill metadata applied to newly added line items.</p>
            </div>
            <button type="button" class="btn btn-ghost" @click="resetCarpetDefaults">Reset</button>
          </div>
          <div class="grid gap-4 md:grid-cols-4">
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Label</label>
              <input v-model="carpetDefaults.sizeLabel" type="text" class="input-control" placeholder="8x10" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Length (m)</label>
              <input v-model.number="carpetDefaults.length" type="number" min="0" step="0.01" class="input-control" placeholder="2.5" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Width (m)</label>
              <input v-model.number="carpetDefaults.width" type="number" min="0" step="0.01" class="input-control" placeholder="1.7" />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Origin</label>
              <input v-model="carpetDefaults.origin" type="text" class="input-control" placeholder="Persian" />
        </div>
      </div>
        </section>

        <section class="card-shell space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
              <h2 class="text-lg font-semibold text-gray-900">Line items</h2>
              <p class="text-sm text-gray-500">Capture quantity, pricing, and carpet metadata per item.</p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-ghost" @click="showProductSelector = true">Import from CCV Shop</button>
              <button type="button" class="btn btn-ghost" @click="addEmptyItem">+ Add custom item</button>
            </div>
        </div>

          <div v-if="form.items.length === 0" class="border-2 border-dashed border-gray-200 rounded-xl py-12 text-center text-sm text-gray-500">
            No items yet. Import from CCV Shop or add a custom entry.
        </div>

          <div v-else class="space-y-4">
          <div
            v-for="(item, index) in form.items"
            :key="index"
              class="rounded-xl border border-gray-100 bg-white p-4 space-y-4"
          >
              <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Item name *</label>
                  <input v-model="item.productName" type="text" required class="input-control" placeholder="Vintage wool rug" />
                </div>
                <button type="button" class="btn btn-ghost" @click="removeItem(index)">Remove</button>
              </div>
              <div>
                <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Description</label>
                <textarea v-model="item.description" rows="2" class="input-control" placeholder="Describe materials, weave, or condition" />
              </div>
              <div class="grid gap-4 md:grid-cols-4">
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Quantity *</label>
                  <input v-model.number="item.quantity" type="number" min="1" required class="input-control" />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Unit price *</label>
                  <input v-model.number="item.price" type="number" min="0" step="0.01" required class="input-control" />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Size label</label>
                  <input v-model="item.sizeLabel" type="text" class="input-control" :placeholder="carpetDefaults.sizeLabel || '8x10'" />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Origin</label>
                  <input v-model="item.origin" type="text" class="input-control" :placeholder="carpetDefaults.origin || 'Persian'" />
                </div>
              </div>
              <div class="grid gap-4 md:grid-cols-4">
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Length (m)</label>
                  <input v-model.number="item.length" type="number" min="0" step="0.01" class="input-control" />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Width (m)</label>
                  <input v-model.number="item.width" type="number" min="0" step="0.01" class="input-control" />
                </div>
                <div class="md:col-span-2 flex items-center justify-end text-sm text-gray-600">
                  Line total
                  <span class="ml-2 font-semibold text-gray-900">{{ formatCurrency(lineTotal(item), form.currency) }}</span>
            </div>
              </div>
            </div>
          </div>
        </section>

        <section class="card-shell space-y-5">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-semibold uppercase text-gray-500">Discounts</h3>
                <p class="text-xs text-gray-500">Apply percentage or fixed amount discounts.</p>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Discount Type</label>
                  <select v-model="form.discountType" class="input-control">
                    <option value="amount">Fixed amount</option>
                    <option value="percent">Percentage</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Value</label>
                  <input
                    v-model.number="form.discount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input-control"
                    :placeholder="form.discountType === 'amount' ? '0.00' : '0%'"
                  />
          </div>
        </div>
      </div>

            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-semibold uppercase text-gray-500">Initial payment</h3>
                <p class="text-xs text-gray-500">Record upfront payments received before sending.</p>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Amount</label>
                  <input
                    v-model.number="initialPayment.amount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input-control"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Method</label>
                  <select v-model="initialPayment.method" class="input-control">
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Reference</label>
                  <input v-model="initialPayment.reference" type="text" class="input-control" placeholder="Transaction ID" />
                </div>
                <div>
                  <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Payment date</label>
                  <input v-model="initialPayment.paidAt" type="date" class="input-control" />
                </div>
        </div>
              <div>
                <label class="text-xs font-semibold uppercase text-gray-500 block mb-1">Private notes</label>
                <textarea v-model="initialPayment.notes" rows="2" class="input-control" placeholder="Internal notes, not visible to the customer" />
        </div>
        </div>
      </div>
        </section>

        <section class="card-shell space-y-3 text-sm text-gray-600">
          <div class="flex items-center justify-between">
            <span>Subtotal</span>
            <span class="font-medium text-gray-900">{{ formatCurrency(subtotal, form.currency) }}</span>
          </div>
          <div class="flex items-center justify-between" v-if="form.discountAmount > 0">
            <span>Discount</span>
            <span class="font-medium text-emerald-600">-{{ formatCurrency(form.discountAmount, form.currency) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Tax ({{ form.taxRate }}%)</span>
            <span class="font-medium text-gray-900">{{ formatCurrency(taxAmount, form.currency) }}</span>
          </div>
          <div class="flex items-center justify-between text-lg font-semibold text-gray-900 border-t border-dashed border-gray-200 pt-4 mt-4">
            <span>Total due</span>
            <span>{{ formatCurrency(total, form.currency) }}</span>
          </div>
        </section>

        <div class="flex justify-end gap-3">
          <NuxtLink to="/invoices" class="btn btn-ghost">Cancel</NuxtLink>
        <button
            type="button"
            class="btn btn-primary"
            :disabled="disabledSubmit || submitting"
            @click="submitInvoice(false)"
          >
            <span v-if="submitting">Saving...</span>
            <span v-else>Save invoice</span>
        </button>
      </div>
    </form>

      <aside v-if="showPreview" class="space-y-6">
        <div class="card-shell overflow-hidden p-0">
          <iframe
            title="Invoice Preview"
            class="w-full h-[900px]"
            :srcdoc="previewHtml"
            style="background:#ffffff; display:block; border:0;"
          />
        </div>
      </aside>
      </div>

    <div
      v-if="showProductSelector"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="showProductSelector = false"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Import from CCV Shop</h3>
            <p class="text-sm text-gray-500">Select products to convert directly into invoice line items.</p>
          </div>
          <button type="button" class="btn btn-ghost" @click="showProductSelector = false">
            Close
          </button>
        </div>
        <div class="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div v-if="loadingProducts" class="text-center text-sm text-gray-500 py-10">
            Loading products...
          </div>
          <div v-else-if="products.length === 0" class="text-center text-sm text-gray-500 py-10">
            No products available.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="product in products"
              :key="product.id"
              class="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50 transition"
            >
              <div class="flex-1 pr-4">
                <p class="font-medium text-gray-900">{{ product.name }}</p>
                <p class="text-sm text-gray-500">{{ formatCurrency(product.price, form.currency) }}</p>
                <p v-if="product.stock !== undefined" class="text-xs text-gray-400">
                  Stock: {{ product.stock }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="productQuantities[product.id]"
                  type="number"
                  min="1"
                  :max="product.stock"
                  class="input-control w-24"
                  placeholder="Qty"
                />
                <button type="button" class="btn btn-primary" @click="addProduct(product)">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'nuxt/app'
import { $fetch } from 'ofetch'

declare function definePageMeta(meta: any): void

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const showPreview = ref(true)
const submitting = ref(false)
const showProductSelector = ref(false)
const loadingProducts = ref(false)

const today = new Date()
const defaultDue = new Date(today)
defaultDue.setDate(today.getDate() + 30)

const form = reactive({
  invoiceNumber: '',
  currency: 'USD',
  taxRate: 0,
  invoiceDate: today.toISOString().slice(0, 10),
  dueDate: defaultDue.toISOString().slice(0, 10),
  terms: 'Net 30',
  memo: '',
  customerName: '',
  customerEmail: '',
  customerAddress: '',
  discount: 0,
  discountType: 'amount' as 'amount' | 'percent',
  discountAmount: 0,
  items: [] as Array<InvoiceItem>
})

const carpetDefaults = reactive({
  sizeLabel: '',
  length: null as number | null,
  width: null as number | null,
  origin: ''
})

const initialPayment = reactive({
  amount: null as number | null,
  method: 'bank_transfer',
  reference: '',
  notes: '',
  paidAt: ''
})

interface InvoiceItem {
  productId?: string
  productName: string
  description?: string
  quantity: number
  price: number
  sizeLabel?: string
  length?: number | null
  width?: number | null
  origin?: string
}

const products = ref<any[]>([])
const productQuantities = reactive<Record<string, number>>({})

onMounted(loadProducts)

const subtotal = computed(() =>
  form.items.reduce((sum, item) => sum + lineTotal(item), 0)
)

const taxBase = computed(() => Math.max(subtotal.value - (form.discountAmount || 0), 0))
const taxAmount = computed(() => (taxBase.value * (form.taxRate || 0)) / 100)
const total = computed(() => taxBase.value + taxAmount.value)
const disabledSubmit = computed(
  () => form.items.length === 0 || !form.invoiceNumber || !form.customerName || !form.customerEmail
)

watch(
  () => [form.discount, form.discountType, subtotal.value],
  () => {
    const base = subtotal.value
    if (form.discountType === 'percent') {
      form.discountAmount = Math.min(base, (base * (form.discount || 0)) / 100)
    } else {
      form.discountAmount = Math.min(base, form.discount || 0)
    }
  }
)

watch(
  () => form.invoiceDate,
  (value) => {
    if (!form.dueDate && value) {
      const d = new Date(value)
      d.setDate(d.getDate() + 30)
      form.dueDate = d.toISOString().slice(0, 10)
    }
  }
)

async function loadProducts() {
  loadingProducts.value = true
  try {
    const response = await $fetch('/api/ccv/products')
    products.value = response?.products || []
  } catch (error) {
    console.error('Error loading products:', error)
  } finally {
    loadingProducts.value = false
  }
}

function addProduct(product: any) {
  const quantity = productQuantities[product.id] || 1
  if (product.stock !== undefined && quantity > product.stock) {
    alert('Quantity exceeds available stock')
    return
  }
  
  form.items.push({
    productId: product.id,
    productName: product.name,
    description: product.description || '',
    quantity,
    price: product.price,
    sizeLabel: carpetDefaults.sizeLabel || undefined,
    length: carpetDefaults.length ?? undefined,
    width: carpetDefaults.width ?? undefined,
    origin: carpetDefaults.origin || undefined
  })

  productQuantities[product.id] = 1
  showProductSelector.value = false
}

function addEmptyItem() {
  form.items.push({
    productName: '',
    description: '',
    quantity: 1,
    price: 0,
    sizeLabel: carpetDefaults.sizeLabel || undefined,
    length: carpetDefaults.length ?? undefined,
    width: carpetDefaults.width ?? undefined,
    origin: carpetDefaults.origin || undefined
  })
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function lineTotal(item: InvoiceItem) {
  return (Number(item.price) || 0) * (Number(item.quantity) || 0)
}

function formatCurrency(value: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value || 0)
  } catch {
    return `$${Number(value || 0).toFixed(2)}`
  }
}

function formatDate(value?: string | Date, options?: { raw?: boolean }) {
  if (!value) return options?.raw ? '' : '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return options?.raw ? '' : '—'
  if (options?.raw) {
    return date.toISOString().slice(0, 10)
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const previewHtml = ref('')
const previewUpdating = ref(false)
let previewTimeout: ReturnType<typeof setTimeout> | null = null

const previewPayload = computed(() => ({
  invoiceNumber: form.invoiceNumber || 'INV-XXXXXX',
  customerName: form.customerName || 'Client Name',
  customerEmail: form.customerEmail || 'client@email.com',
  invoiceDate: formatDate(form.invoiceDate || today, { raw: true }),
  dueDate: formatDate(form.dueDate, { raw: true }),
  status: 'draft',
  currency: form.currency,
  subtotal: subtotal.value,
  tax: taxAmount.value,
  total: total.value,
  memo: form.memo,
  terms: form.terms,
  payments: initialPayment.amount
    ? [
        {
          amount: initialPayment.amount,
          method: initialPayment.method,
          reference: initialPayment.reference,
          notes: initialPayment.notes,
          paidAt: initialPayment.paidAt
        }
      ]
    : [],
  items: form.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    total: lineTotal(item),
    sizeLabel: item.sizeLabel,
    length: item.length,
    width: item.width,
    origin: item.origin
  }))
}))

watch(
  previewPayload,
  () => {
    if (previewTimeout) {
      clearTimeout(previewTimeout)
    }
    previewTimeout = setTimeout(updatePreviewHtml, 250)
  },
  { deep: true, immediate: true }
)

onBeforeUnmount(() => {
  if (previewTimeout) {
    clearTimeout(previewTimeout)
  }
})

async function updatePreviewHtml() {
  previewUpdating.value = true
  try {
    const html = await $fetch<string>('/api/invoices/temp-preview', {
      method: 'POST',
      body: { invoice: previewPayload.value }
    })
    previewHtml.value = html
  } catch (error) {
    previewHtml.value = buildPreviewHtml(previewPayload.value)
  } finally {
    previewUpdating.value = false
  }
}

function buildPreviewHtml(payload: {
  invoiceNumber: string
  customerName: string
  customerEmail: string
  invoiceDate?: string
  dueDate?: string
  status: string
  items: Array<{
    productName: string
    description?: string
    quantity: number
    price: number
    total: number
    sizeLabel?: string
    length?: number | null
    width?: number | null
    origin?: string
  }>
  subtotal: number
  tax: number
  total: number
  currency: string
  memo?: string
  terms?: string
}) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: payload.currency || 'USD'
    }).format(value ?? 0)

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body { margin: 0; padding: 0; background: #ffffff; color: #1f2937; }
      body { font-family: Arial, sans-serif; padding: 0; }
      .container { width: 100%; box-sizing: border-box; padding: 40px 48px; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
      .invoice-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
      table { width: 100%; border-collapse: collapse; margin: 30px 0; }
      th { background-color: #f8fafc; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
      td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
      .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
      .totals table { width: 320px; }
      .totals td { border: none; }
      .total-row td { font-size: 16px; font-weight: bold; border-top: 2px solid #e2e8f0; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; }
      .status { display: inline-flex; padding: 6px 14px; border-radius: 9999px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
      .status-paid { background: #dcfce7; color: #166534; }
      .status-sent { background: #dbeafe; color: #1d4ed8; }
      .status-partial { background: #fef3c7; color: #92400e; }
      .status-draft { background: #e2e8f0; color: #475569; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
          <div>
            <h1>Invoice ${payload.invoiceNumber}</h1>
            <p><strong>Date:</strong> ${payload.invoiceDate || ''}</p>
            <p><strong>Due Date:</strong> ${payload.dueDate || '—'}</p>
            <p><strong>Status:</strong> <span class="status status-${payload.status}">${payload.status.toUpperCase()}</span></p>
          </div>
          <div>
            <h3>Bill To</h3>
            <p><strong>${payload.customerName}</strong></p>
            <p>${payload.customerEmail}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${payload.items
              .map(
                (item) => `
            <tr>
              <td>
                <div style="font-weight:600;color:#0f172a;">${item.productName}</div>
                ${item.description ? `<div style="color:#94a3b8;font-size:12px;">${item.description}</div>` : ''}
                <div style="color:#cbd5f5;font-size:12px;">${item.sizeLabel || '-'} • ${item.origin || '-'}</div>
              </td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.price)}</td>
              <td>${formatCurrency(item.total)}</td>
            </tr>
          `
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td style="text-align:right;">Subtotal:</td>
              <td style="text-align:right;">${formatCurrency(payload.subtotal)}</td>
            </tr>
            <tr>
              <td style="text-align:right;">Tax:</td>
              <td style="text-align:right;">${formatCurrency(payload.tax)}</td>
            </tr>
            <tr class="total-row">
              <td style="text-align:right;">Total:</td>
              <td style="text-align:right;">${formatCurrency(payload.total)}</td>
            </tr>
          </table>
        </div>

        ${payload.memo ? `<div style="margin-top:24px;"><h3>Memo</h3><p>${payload.memo}</p></div>` : ''}
        ${payload.terms ? `<div style="margin-top:24px;"><h3>Terms</h3><p>${payload.terms}</p></div>` : ''}

        <div class="footer">
          <p>Thank you for your business.</p>
        </div>
      </div>
    </div>
  </body>
</html>
`
}

async function submitInvoice(sendEmail: boolean) {
  if (disabledSubmit.value) return
  submitting.value = true
  try {
    const response = await $fetch('/api/invoices', {
      method: 'POST',
      body: {
        invoiceNumber: form.invoiceNumber,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        items: form.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: lineTotal(item),
          sizeLabel: item.sizeLabel,
          length: item.length,
          width: item.width,
          origin: item.origin
        })),
        tax: form.taxRate,
        currency: form.currency,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        terms: form.terms,
        memo: form.memo,
        initialPayment: initialPayment.amount
          ? {
              amount: initialPayment.amount,
              method: initialPayment.method,
              reference: initialPayment.reference || undefined,
              notes: initialPayment.notes || undefined,
              paidAt: initialPayment.paidAt || undefined
            }
          : undefined
      }
    })

    if (sendEmail && response?.invoice?._id) {
      await $fetch(`/api/invoices/${response.invoice._id}/email`, {
        method: 'POST',
        body: {
          to: form.customerEmail,
          subject: `Invoice ${form.invoiceNumber}`,
          message: form.memo || 'Please find your invoice attached.'
        }
      })
    }
    
    await router.push(`/invoices/${response.invoice._id}`)
  } catch (error: any) {
    alert(error?.data?.message || 'Failed to create invoice')
  } finally {
    submitting.value = false
  }
}

async function saveDraft() {
  await submitInvoice(false)
}

function prefillDemo() {
  form.invoiceNumber = `INV-${Math.floor(Math.random() * 9000 + 1000)}`
  form.customerName = 'Pocket Films'
  form.customerEmail = 'billing@pocketfilms.com'
  form.customerAddress = '2972 Westheimer Rd.\nSanta Ana, CA 85486'
  form.currency = 'USD'
  form.taxRate = 8.5
  form.memo = 'Payment is due within 30 days. Late fees may apply.'
  form.terms = 'Net 30'
  form.items = [
    {
      productName: 'Premium Carpet Cleaning',
      description: 'Deep clean service for luxury wool rugs',
      quantity: 1,
      price: 450,
      sizeLabel: '9x12',
      origin: 'Persian'
    },
    {
      productName: 'Restoration Service',
      description: 'Hand repair and fringe replacement',
      quantity: 1,
      price: 320,
      sizeLabel: 'Custom',
      origin: 'Turkish'
    }
  ]
}

function resetCarpetDefaults() {
  carpetDefaults.sizeLabel = ''
  carpetDefaults.length = null
  carpetDefaults.width = null
  carpetDefaults.origin = ''
}

const paymentLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  card: 'Card',
  cheque: 'Cheque',
  other: 'Other'
}

</script>