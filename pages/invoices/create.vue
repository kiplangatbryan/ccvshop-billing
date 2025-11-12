<template>
  <div class="page-shell tw-space-y-8">
    <div class="page-header">
      <div>
        <p class="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-[#b91c1c]">Create</p>
        <h1>New Invoice</h1>
        <p class="tw-text-gray-500 tw-mt-2">
          Capture client details, line items, and payment expectations while previewing the final invoice in real time.
        </p>
      </div>
      <div class="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
        <VBtn variant="text" color="primary" @click="prefillDemo" prepend-icon="mdi-clipboard-play-outline">
          Load sample data
        </VBtn>
      </div>
    </div>

    <div class="tw-grid tw-gap-6 xl:tw-grid-cols-[1fr,1fr]">
      <VForm class="tw-space-y-6" @submit.prevent>
        <VStepper v-model="currentStep" flat bg-color="transparent" class="tw-bg-transparent tw-shadow-none">
          <VStepperHeader class="tw-bg-transparent tw-px-0">
            <VStepperItem v-for="(step, index) in steps" :key="step.id" :value="String(index)" :title="step.label"
              :subtitle="step.hint" :complete="index < currentStepIndex" :editable="index <= currentStepIndex"
              :color="index <= currentStepIndex ? 'primary' : undefined" class="tw-px-0" />
          </VStepperHeader>

          <VStepperWindow class="tw-pt-6 tw-space-y-6">
            <VStepperWindowItem value="0">
              <section class="card-shell tw-space-y-5">
                <div>
                  <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Invoice information</h2>
                  <p class="tw-text-sm tw-text-gray-500">Reference details shown on the invoice header.</p>
                </div>
                <VRow dense>
                  <VCol cols="12" md="4">
                    <VTextField v-model="form.invoiceNumber" label="Invoice number" variant="outlined"
                      density="comfortable" color="primary" required :error="Boolean(fieldErrors.invoiceNumber)"
                      :error-messages="fieldErrors.invoiceNumber ? [fieldErrors.invoiceNumber] : []" />
                  </VCol>
                  <VCol cols="12" md="4">
                    <VSelect v-model="form.currency" :items="currencyItems" label="Currency" variant="outlined"
                      density="comfortable" color="primary" />
                  </VCol>
                  <VCol cols="12" md="4">
                    <VTextField v-model.number="form.taxRate" type="number" min="0" step="0.1" label="Tax rate (%)"
                      variant="outlined" density="comfortable" color="primary" />
                  </VCol>
                  <VCol cols="12" md="4">
                    <VTextField v-model="form.invoiceDate" type="date" label="Invoice date" variant="outlined"
                      density="comfortable" color="primary" />
                  </VCol>
                  <VCol cols="12" md="4">
                    <VTextField v-model="form.dueDate" type="date" label="Due date" variant="outlined"
                      density="comfortable" color="primary" />
                  </VCol>
                  <VCol cols="12" md="4">
                    <VTextField v-model="form.terms" label="Payment terms" placeholder="Net 30" variant="outlined"
                      density="comfortable" color="primary" />
                  </VCol>
                </VRow>
                <VTextarea v-model="form.memo" label="Memo (visible to client)" rows="3" auto-grow variant="outlined"
                  density="comfortable" color="primary"
                  placeholder="Thank you for your business. Please include invoice number with payment." />
              </section>
            </VStepperWindowItem>

            <VStepperWindowItem value="1">
              <section class="card-shell tw-space-y-5">
                <div>
                  <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Bill to</h2>
                  <p class="tw-text-sm tw-text-gray-500">Specify who will receive this invoice.</p>
                </div>
                <VRow dense>
                  <VCol cols="12" md="6">
                    <VTextField v-model="form.customerName" label="Client name" variant="outlined" density="comfortable"
                      color="primary" required :error="Boolean(fieldErrors.customerName)"
                      :error-messages="fieldErrors.customerName ? [fieldErrors.customerName] : []" />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VTextField v-model="form.customerEmail" type="email" label="Client email" variant="outlined"
                      density="comfortable" color="primary" required :error="Boolean(fieldErrors.customerEmail)"
                      :error-messages="fieldErrors.customerEmail ? [fieldErrors.customerEmail] : []" />
                  </VCol>
                  <VCol cols="12">
                    <VTextarea v-model="form.customerAddress" label="Client address" rows="3" auto-grow
                      variant="outlined" density="comfortable" color="primary" placeholder="Street, City, Country" />
                  </VCol>
                </VRow>
              </section>
            </VStepperWindowItem>

            <VStepperWindowItem value="2">
              <div class="tw-space-y-6">
                <section class="card-shell tw-space-y-5">
                  <div class="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                    <div>
                      <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Carpet defaults</h2>
                      <p class="tw-text-sm tw-text-gray-500">Prefill metadata applied to newly added line items.</p>
                    </div>
                    <VBtn variant="text" color="secondary" @click="resetCarpetDefaults">
                      Reset
                    </VBtn>
                  </div>
                  <VRow dense>
                    <VCol cols="12" md="3">
                      <VTextField v-model="carpetDefaults.sizeLabel" label="Label" variant="outlined"
                        density="comfortable" color="primary" placeholder="8x10" />
                    </VCol>
                    <VCol cols="12" md="3">
                      <VTextField v-model.number="carpetDefaults.length" type="number" min="0" step="0.01"
                        label="Length (m)" variant="outlined" density="comfortable" color="primary" placeholder="2.5" />
                    </VCol>
                    <VCol cols="12" md="3">
                      <VTextField v-model.number="carpetDefaults.width" type="number" min="0" step="0.01"
                        label="Width (m)" variant="outlined" density="comfortable" color="primary" placeholder="1.7" />
                    </VCol>
                    <VCol cols="12" md="3">
                      <VTextField v-model="carpetDefaults.origin" label="Origin" variant="outlined"
                        density="comfortable" color="primary" placeholder="Persian" />
                    </VCol>
                  </VRow>
                </section>

                <section class="card-shell tw-space-y-6">
                  <div class="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                    <div>
                      <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Line items</h2>
                      <p class="tw-text-sm tw-text-gray-500">Capture quantity, pricing, and carpet metadata per item.
                      </p>
                    </div>
                    <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                      <VBtn variant="text" color="secondary" @click="showProductSelector = true">
                        Import from CCV Shop
                      </VBtn>
                      <VBtn variant="tonal" color="primary" @click="addEmptyItem">
                        + Add custom item
                      </VBtn>
                    </div>
                  </div>

                  <VAlert v-if="fieldErrors.items" type="error" variant="tonal" density="comfortable"
                    class="tw-rounded-2xl">
                    {{ fieldErrors.items }}
                  </VAlert>

                  <div v-if="form.items.length === 0"
                    class="tw-border-2 tw-border-dashed tw-border-gray-200 tw-rounded-2xl tw-py-12 tw-text-center tw-text-sm tw-text-gray-500">
                    No items yet. Import from CCV Shop or add a custom entry.
                  </div>

                  <div v-else class="tw-space-y-4">
                    <VCard v-for="(item, index) in form.items" :key="index" variant="outlined"
                      class="tw-rounded-2xl tw-space-y-4">
                      <VCardText class="tw-space-y-4">
                        <div class="tw-flex tw-flex-wrap tw-items-start tw-gap-4">
                          <div class="tw-flex-1">
                            <VTextField v-model="item.productName" label="Item name" variant="outlined"
                              density="comfortable" color="primary" required
                              :error="Boolean(fieldErrors.lineItems[index]?.productName)" :error-messages="fieldErrors.lineItems[index]?.productName
                                ? [fieldErrors.lineItems[index]?.productName]
                                : []
                                " />
                          </div>
                          <VBtn variant="text" color="error" class="tw-self-start" @click="removeItem(index)">
                            Remove
                          </VBtn>
                        </div>

                        <VTextarea v-model="item.description" label="Description" rows="2" auto-grow variant="outlined"
                          density="comfortable" color="primary" placeholder="Describe materials, weave, or condition" />

                        <VRow dense>
                          <VCol cols="12" md="3">
                            <VTextField v-model.number="item.quantity" type="number" min="1" label="Quantity"
                              variant="outlined" density="comfortable" color="primary" required
                              :error="Boolean(fieldErrors.lineItems[index]?.quantity)" :error-messages="fieldErrors.lineItems[index]?.quantity
                                ? [fieldErrors.lineItems[index]?.quantity]
                                : []
                                " />
                          </VCol>
                          <VCol cols="12" md="3">
                            <VTextField v-model.number="item.price" type="number" min="0" step="0.01" label="Unit price"
                              variant="outlined" density="comfortable" color="primary" required
                              :error="Boolean(fieldErrors.lineItems[index]?.price)" :error-messages="fieldErrors.lineItems[index]?.price
                                ? [fieldErrors.lineItems[index]?.price]
                                : []
                                " />
                          </VCol>
                          <VCol cols="12" md="3">
                            <VTextField v-model="item.sizeLabel" label="Size label" variant="outlined"
                              density="comfortable" color="primary" :placeholder="carpetDefaults.sizeLabel || '8x10'" />
                          </VCol>
                          <VCol cols="12" md="3">
                            <VTextField v-model="item.origin" label="Origin" variant="outlined" density="comfortable"
                              color="primary" :placeholder="carpetDefaults.origin || 'Persian'" />
                          </VCol>
                        </VRow>

                        <VRow dense>
                          <VCol cols="12" md="3">
                            <VTextField v-model.number="item.length" type="number" min="0" step="0.01"
                              label="Length (m)" variant="outlined" density="comfortable" color="primary"
                              @blur="recalculateItemTotals(item)" />
                          </VCol>
                          <VCol cols="12" md="3">
                            <VTextField v-model.number="item.width" type="number" min="0" step="0.01" label="Width (m)"
                              variant="outlined" density="comfortable" color="primary"
                              @blur="recalculateItemTotals(item)" />
                          </VCol>
                          <VCol cols="12" md="3">
                            <VTextField :value="formatArea(item)" label="Area (m²)" variant="outlined"
                              density="comfortable" color="primary" readonly />
                          </VCol>
                          <VCol cols="12" md="3">
                            <VTextField :value="formatCurrency(lineTotal(item), form.currency)" label="Line total"
                              variant="outlined" density="comfortable" color="primary" readonly />
                          </VCol>
                        </VRow>
                      </VCardText>
                    </VCard>
                  </div>
                </section>
              </div>
            </VStepperWindowItem>

            <VStepperWindowItem value="3">
              <div class="tw-space-y-5">
                <section class="card-shell tw-space-y-4">
                  <div>
                    <h2 class="tw-text-lg tw-font-semibold tw-text-gray-900">Discounts</h2>
                    <p class="tw-text-sm tw-text-gray-500">Apply percentage or fixed amount discounts.</p>
                  </div>
                  <VRow dense>
                    <VCol cols="12" md="6">
                      <VSelect v-model="form.discountType" :items="discountTypeItems" label="Discount type"
                        variant="outlined" density="comfortable" color="primary" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model.number="form.discount" type="number" min="0" step="0.01"
                        :label="form.discountType === 'amount' ? 'Value (fixed)' : 'Value (%)'" variant="outlined"
                        density="comfortable" color="primary"
                        :placeholder="form.discountType === 'amount' ? '0.00' : '0%'" />
                    </VCol>
                  </VRow>
                </section>

                <section class="card-shell tw-space-y-3">
                  <div class="tw-flex tw-items-center tw-justify-between tw-text-sm tw-text-gray-600">
                    <span>Subtotal</span>
                    <span>{{ formatCurrency(subtotal, form.currency) }}</span>
                  </div>
                  <div v-if="form.discountAmount > 0" class="tw-flex tw-items-center tw-justify-between tw-text-sm">
                    <span>Discount</span>
                    <span class="tw-text-emerald-600">-{{ formatCurrency(form.discountAmount, form.currency) }}</span>
                  </div>
                  <div class="tw-flex tw-items-center tw-justify-between tw-text-sm tw-text-gray-600">
                    <span>Tax ({{ form.taxRate }}%)</span>
                    <span>{{ formatCurrency(taxAmount, form.currency) }}</span>
                  </div>
                  <div
                    class="tw-flex tw-items-center tw-justify-between tw-text-base tw-font-semibold tw-text-gray-900">
                    <span>Total due</span>
                    <span>{{ formatCurrency(total, form.currency) }}</span>
                  </div>
                </section>
              </div>
            </VStepperWindowItem>
          </VStepperWindow>

          <VStepperActions class="tw-pt-4">
            <template #prev>
              <VBtn variant="text" color="primary" @click="prevStep" :disabled="currentStepIndex === 0">
                Back
              </VBtn>
            </template>
            <template #next>
              <div class="tw-flex tw-flex-wrap md:tw-flex-row md:tw-items-center tw-gap-3">
                <template v-if="currentStepIndex < steps.length - 1">
                  <VBtn color="primary" @click="handleNextStep">
                    Next
                  </VBtn>
                </template>
                <template v-else>
                  <div class="tw-flex tw-flex-wrap tw-justify-end tw-gap-2">
                    <VBtn variant="text" color="secondary" @click="saveDraft" :disabled="submitting">
                      Save draft
                    </VBtn>
                    <VBtn color="primary" :loading="submitting" @click="submitInvoice(true)"
                      :disabled="submitting || disabledSubmit">
                      Save &amp; send
                    </VBtn>
                  </div>
                </template>
              </div>
            </template>
          </VStepperActions>
        </VStepper>
      </VForm>

      <aside v-if="showPreview" class="tw-w-full">
        <div class="tw-overflow-hidden tw-h-full">
          <iframe
            title="Invoice Preview"
            class="tw-w-full tw-h-[960px]"
            :src="previewPdfUrl || 'about:blank'"
            style="background:#ffffff; display:block; border:0;"
          />
        </div>
      </aside>
    </div>
  </div>

  <VDialog v-model="showProductSelector" max-width="900" scrollable>
    <VCard>
      <VCardTitle class="tw-flex tw-items-center tw-justify-between tw-gap-4">
        <div>
          <h3 class="tw-text-lg tw-font-semibold tw-text-gray-900">Import from CCV Shop</h3>
          <p class="tw-text-sm tw-text-gray-500">Select products to convert directly into invoice line items.</p>
        </div>
        <VBtn variant="text" color="secondary" @click="showProductSelector = false">
          Close
        </VBtn>
      </VCardTitle>
      <VCardText>
        <div v-if="loadingProducts" class="tw-text-center tw-text-sm tw-text-gray-500 tw-py-10">
          Loading products...
        </div>
        <div v-else-if="products.length === 0" class="tw-text-center tw-text-sm tw-text-gray-500 tw-py-10">
          No products available.
        </div>
        <div v-else class="tw-space-y-3">
          <VSheet v-for="product in products" :key="product.id"
            class="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-border tw-border-gray-100 tw-rounded-2xl tw-px-4 tw-py-3 hover:tw-bg-gray-50 tw-transition">
            <div class="tw-flex-1 tw-pr-4">
              <p class="tw-font-medium tw-text-gray-900">{{ product.name }}</p>
              <p class="tw-text-sm tw-text-gray-500">{{ formatCurrency(product.price, form.currency) }}</p>
              <p v-if="product.stock !== undefined" class="tw-text-xs tw-text-gray-400">
                Stock: {{ product.stock }}
              </p>
            </div>
            <div class="tw-flex tw-items-center tw-gap-2">
              <VTextField v-model.number="productQuantities[product.id]" type="number" min="1" :max="product.stock"
                label="Qty" variant="outlined" density="comfortable" color="primary" class="tw-w-24" />
              <VBtn color="primary" variant="tonal" @click="addProduct(product)">
                Add
              </VBtn>
            </div>
          </VSheet>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
declare function definePageMeta(meta: any): void

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const $fetch = useRequestFetch()
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

const currencyItems = [
  { title: 'USD ($)', value: 'USD' },
  { title: 'EUR (€)', value: 'EUR' },
  { title: 'GBP (£)', value: 'GBP' },
  { title: 'CAD ($)', value: 'CAD' },
  { title: 'AED (د.إ)', value: 'AED' }
]

const discountTypeItems = [
  { title: 'Fixed amount', value: 'amount' },
  { title: 'Percentage', value: 'percent' }
]

type StepDefinition = {
  id: string
  label: string
  hint: string
}

const steps = ref<StepDefinition[]>([
  {
    id: 'invoice-details',
    label: 'Invoice details',
    hint: 'Number, currency, memo'
  },
  {
    id: 'bill-to',
    label: 'Bill to',
    hint: 'Client information'
  },
  {
    id: 'line-items',
    label: 'Line items',
    hint: 'Defaults and products'
  },
  {
    id: 'review',
    label: 'Review & totals',
    hint: 'Discounts and summary'
  }
])

const currentStep = ref('0')
const currentStepIndex = computed(() => Number(currentStep.value))
const debugLog = (...args: any[]) => {
  console.log('[create-invoice]', ...args)
}

type LineItemError = {
  productName: string
  quantity: string
  price: string
}

const fieldErrors = reactive({
  invoiceNumber: '',
  customerName: '',
  customerEmail: '',
  items: '',
  lineItems: [] as LineItemError[]
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getStepSnapshot(index: number) {
  if (index === 0) {
    return {
      invoiceNumber: form.invoiceNumber,
      currency: form.currency,
      taxRate: form.taxRate,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      terms: form.terms
    }
  }
  if (index === 1) {
    return {
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerAddressLength: form.customerAddress?.length ?? 0
    }
  }
  if (index === 2) {
    return {
      lineItemCount: form.items.length,
      items: form.items.map((item, idx) => ({
        idx,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      }))
    }
  }
  return {}
}

function ensureLineItemErrors() {
  while (fieldErrors.lineItems.length < form.items.length) {
    fieldErrors.lineItems.push({
      productName: '',
      quantity: '',
      price: ''
    })
  }
  while (fieldErrors.lineItems.length > form.items.length) {
    fieldErrors.lineItems.pop()
  }
}

function validateStep(index: number) {
  let valid = true

  if (index === 0) {
    fieldErrors.invoiceNumber = form.invoiceNumber.trim()
      ? ''
      : 'Invoice number is required'
    if (fieldErrors.invoiceNumber) {
      debugLog('Step validation failed', {
        step: index,
        errors: { invoiceNumber: fieldErrors.invoiceNumber }
      })
    }
    valid = !fieldErrors.invoiceNumber
  } else if (index === 1) {
    fieldErrors.customerName = form.customerName.trim()
      ? ''
      : 'Client name is required'

    if (!form.customerEmail.trim()) {
      fieldErrors.customerEmail = 'Client email is required'
    } else if (!emailPattern.test(form.customerEmail.trim())) {
      fieldErrors.customerEmail = 'Enter a valid email address'
    } else {
      fieldErrors.customerEmail = ''
    }

    if (fieldErrors.customerName || fieldErrors.customerEmail) {
      debugLog('Step validation failed', {
        step: index,
        errors: {
          customerName: fieldErrors.customerName,
          customerEmail: fieldErrors.customerEmail
        }
      })
    }

    valid = !fieldErrors.customerName && !fieldErrors.customerEmail
  } else if (index === 2) {
    ensureLineItemErrors()

    if (form.items.length === 0) {
      fieldErrors.items = 'Add at least one line item before continuing.'
      return false
    }

    fieldErrors.items = ''

    form.items.forEach((item, idx) => {
      const errors = fieldErrors.lineItems[idx]
      if (!errors) {
        return
      }
      const productName = (item.productName || '').trim()
      const quantity = Number(item.quantity)
      const price = Number(item.price)

      errors.productName = productName ? '' : 'Item name is required'
      errors.quantity = quantity > 0 ? '' : 'Quantity must be greater than zero'
      errors.price = price > 0 ? '' : 'Unit price must be greater than zero'

      if (errors.productName || errors.quantity || errors.price) {
        debugLog('Line item validation failed', {
          step: index,
          itemIndex: idx,
          productName,
          quantity,
          price,
          errors: { ...errors }
        })
        valid = false
      }
    })
  }

  return valid
}

function handleNextStep() {
  console.log('handleNextStep')
  const index = currentStepIndex.value
  debugLog('Next button clicked', {
    step: index,
    snapshot: getStepSnapshot(index),
    form: {
      invoiceNumber: form.invoiceNumber,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      itemCount: form.items.length
    }
  })
  console.log('[create-invoice] raw step', currentStep.value, currentStepIndex.value)
  if (!validateStep(index)) {
    debugLog('Blocked advancing step', { step: index, errors: { ...fieldErrors } })
    return
  }
  debugLog('Advancing to next step', { from: index, to: index + 1 })
  nextStep()
}

function nextStep() {
  console.log('nextStep')
  const index = currentStepIndex.value
  if (index >= steps.value.length - 1) return
  currentStep.value = String(index + 1)
}

function prevStep() {
  const index = currentStepIndex.value
  if (index === 0) return
  currentStep.value = String(index - 1)
}

interface InvoiceItem {
  productId?: string
  productName: string
  description?: string
  quantity: number
  price: number
  sizeLabel?: string
  length?: number | null
  width?: number | null
  area?: number | null
  origin?: string
}

const products = ref<any[]>([])
const productQuantities = reactive<Record<string, number>>({})

let productsLoaded = false

onMounted(() => {
  if (!productsLoaded) {
    loadProducts(true)
  }
})

const subtotal = computed(() =>
  form.items.reduce((sum: number, item: InvoiceItem) => sum + lineTotal(item), 0)
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
  (value: string) => {
    if (!form.dueDate && value) {
      const d = new Date(value)
      d.setDate(d.getDate() + 30)
      form.dueDate = d.toISOString().slice(0, 10)
    }
  }
)

watch(
  () => form.invoiceNumber,
  (value: string) => {
    if (fieldErrors.invoiceNumber && value?.trim()) {
      fieldErrors.invoiceNumber = ''
    }
  }
)

watch(
  () => form.customerName,
  (value: string) => {
    if (fieldErrors.customerName && value?.trim()) {
      fieldErrors.customerName = ''
    }
  }
)

watch(
  () => form.customerEmail,
  (value: string) => {
    if (!fieldErrors.customerEmail || !value?.trim()) return
    if (emailPattern.test(value.trim())) {
      fieldErrors.customerEmail = ''
    }
  }
)

watch(
  () => form.items.length,
  () => {
    ensureLineItemErrors()
    if (form.items.length > 0 && fieldErrors.items) {
      fieldErrors.items = ''
    }
  }
)

watch(
  () =>
    form.items.map((item) => [item.length, item.width]),
  () => {
    form.items.forEach((item) => {
      const area = calculateArea(item)
      if (area !== item.area) {
        item.area = area
      }
    })
  },
  { deep: true }
)

watch(
  () =>
    form.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: item.price
    })),
  (
    items: Array<{
      productName: string
      quantity: number | string
      price: number | string
    }>
  ) => {
    items.forEach((item, idx) => {
      const errors = fieldErrors.lineItems[idx]
      if (!errors) return
      if (errors.productName && (item.productName || '').trim()) {
        errors.productName = ''
      }
      if (errors.quantity && Number(item.quantity) > 0) {
        errors.quantity = ''
      }
      if (errors.price && Number(item.price) > 0) {
        errors.price = ''
      }
    })
  },
  { deep: true }
)

async function loadProducts(initial = false) {
  loadingProducts.value = true
  debugLog(`Loading CCV products${initial ? ' (initial)' : ''}`)
  try {
    const response = await $fetch('/api/ccv/products')
    products.value = response?.products || []
    productsLoaded = true
    debugLog('Loaded CCV products', { total: products.value.length })
  } catch (error) {
    console.error('Error loading products:', error)
    debugLog('Error loading CCV products', error)
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
    area: calculateArea({
      length: carpetDefaults.length ?? null,
      width: carpetDefaults.width ?? null
    }),
    sizeLabel: carpetDefaults.sizeLabel || undefined,
    length: carpetDefaults.length ?? undefined,
    width: carpetDefaults.width ?? undefined,
    origin: carpetDefaults.origin || undefined
  })

  productQuantities[product.id] = 1
  showProductSelector.value = false
  ensureLineItemErrors()
  if (fieldErrors.items) {
    fieldErrors.items = ''
  }
  debugLog('Added product from CCV', {
    id: product.id,
    name: product.name,
    items: form.items.length
  })
}

function addEmptyItem() {
  form.items.push({
    productName: '',
    description: '',
    quantity: 1,
    price: 0,
    area: calculateArea({
      length: carpetDefaults.length ?? null,
      width: carpetDefaults.width ?? null
    }),
    sizeLabel: carpetDefaults.sizeLabel || undefined,
    length: carpetDefaults.length ?? undefined,
    width: carpetDefaults.width ?? undefined,
    origin: carpetDefaults.origin || undefined
  })
  ensureLineItemErrors()
  if (fieldErrors.items) {
    fieldErrors.items = ''
  }
  debugLog('Added empty line item', { totalItems: form.items.length })
}

function removeItem(index: number) {
  debugLog('Removing line item', { index, item: form.items[index] })
  form.items.splice(index, 1)
  fieldErrors.lineItems.splice(index, 1)
  if (form.items.length === 0) {
    fieldErrors.items = ''
  }
}

function calculateArea(item: Pick<InvoiceItem, 'length' | 'width'>) {
  const length = Number(item.length) || 0
  const width = Number(item.width) || 0
  const area = length * width
  return area > 0 ? parseFloat(area.toFixed(2)) : null
}

function lineTotal(item: InvoiceItem) {
  const area = Number(item.area)
  const price = Number(item.price) || 0
  if (area && area > 0) {
    return area * price
  }
  return price * (Number(item.quantity) || 0)
}

function formatArea(item: InvoiceItem) {
  const area = Number(item.area)
  if (!area || area <= 0) {
    return '—'
  }
  return `${area.toFixed(2)}`
}

function recalculateItemTotals(item: InvoiceItem) {
  item.area = calculateArea(item)
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

const previewPdfUrl = ref('')
const previewUpdating = ref(false)
let previewTimeout: ReturnType<typeof setTimeout> | null = null
let previewObjectUrl: string | null = null

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
  taxRate: form.taxRate,
  total: total.value,
  discount: form.discount,
  discountType: form.discountType,
  discountAmount: form.discountAmount,
  memo: form.memo,
  terms: form.terms,
  items: form.items.map((item: InvoiceItem) => ({
    productId: item.productId,
    productName: item.productName,
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    total: lineTotal(item),
    sizeLabel: item.sizeLabel,
    length: item.length,
    width: item.width,
    area: item.area,
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
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl)
    previewObjectUrl = null
  }
})

async function updatePreviewHtml() {
  previewUpdating.value = true
  try {
    const buffer = await $fetch<ArrayBuffer>('/api/invoices/temp-preview', {
      method: 'POST',
      body: { invoice: previewPayload.value },
      responseType: 'arrayBuffer'
    })
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl)
    }
    previewObjectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
    previewPdfUrl.value = previewObjectUrl
  } catch (error) {
    const fallbackHtml = buildPreviewHtml(previewPayload.value)
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl)
    }
    previewObjectUrl = URL.createObjectURL(new Blob([fallbackHtml], { type: 'text/html' }))
    previewPdfUrl.value = previewObjectUrl
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

  for (const stepIndex of [0, 1, 2]) {
    if (!validateStep(stepIndex)) {
      debugLog('Submission blocked - validation failed', {
        step: stepIndex,
        errors: { ...fieldErrors }
      })
      currentStep.value = String(stepIndex)
      return
    }
  }

  debugLog('Submitting invoice', {
    sendEmail,
    items: form.items.length,
    totals: {
      subtotal: subtotal.value,
      tax: taxAmount.value,
      total: total.value
    }
  })
  submitting.value = true
  try {
    const response = await $fetch('/api/invoices', {
      method: 'POST',
      body: {
        invoiceNumber: form.invoiceNumber,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        items: form.items.map((item: InvoiceItem) => ({
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: lineTotal(item),
          sizeLabel: item.sizeLabel,
          length: item.length,
          width: item.width,
          area: item.area,
          origin: item.origin
        })),
        tax: form.taxRate,
        discount: form.discount,
        discountType: form.discountType,
        discountAmount: form.discountAmount,
        currency: form.currency,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        terms: form.terms,
        memo: form.memo
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
    debugLog('Submit invoice failed', error)
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
  debugLog('Resetting carpet defaults', { before: { ...carpetDefaults } })
  carpetDefaults.sizeLabel = ''
  carpetDefaults.length = null
  carpetDefaults.width = null
  carpetDefaults.origin = ''
  debugLog('Carpet defaults reset', { after: { ...carpetDefaults } })
}

</script>