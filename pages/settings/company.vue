<template>
  <div class="page-shell tw-space-y-8">
    <header class="page-header">
      <div>
        <p class="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-[#22c55e]">Organisation</p>
        <h1>Company Settings</h1>
        <p class="tw-text-gray-500 tw-mt-2">
          Keep your business profile up to date for invoices, emails, and notifications.
        </p>
      </div>
    </header>

    <div v-if="loading" class="card-shell tw-text-center tw-text-gray-500">
      Loading settings…
    </div>

    <form v-else @submit.prevent="saveSettings" class="tw-space-y-6">
      <section class="card-shell tw-space-y-4">
        <div class="section-header">
          <h2>Brand identity</h2>
          <p>Show clients who you are on every invoice.</p>
        </div>
        <div class="form-grid">
          <label>
            <span>Company name *</span>
            <input v-model="form.name" type="text" required class="input-control" />
          </label>
          <label>
            <span>Logo URL</span>
            <input v-model="form.logoUrl" type="url" class="input-control" placeholder="https://…" />
          </label>
        </div>
        <div v-if="form.logoUrl" class="logo-preview">
          <p>Preview</p>
          <img :src="form.logoUrl" alt="Company logo" />
        </div>
      </section>

      <section class="card-shell tw-space-y-4">
        <div class="section-header">
          <h2>Contact details</h2>
          <p>These details appear on invoices and outbound messages.</p>
        </div>
        <div class="form-grid">
          <label class="grid-span">
            <span>Address</span>
            <textarea v-model="form.address" rows="3" class="input-control textarea" placeholder="Street, City, Country, Postal code" />
          </label>
          <label>
            <span>Phone</span>
            <input v-model="form.phone" type="text" class="input-control" />
          </label>
          <label>
            <span>Email</span>
            <input v-model="form.email" type="email" class="input-control" />
          </label>
          <label>
            <span>Website</span>
            <input v-model="form.website" type="url" class="input-control" placeholder="https://…" />
          </label>
        </div>
      </section>

      <section class="card-shell tw-space-y-4">
        <div class="section-header">
          <h2>Invoice details</h2>
          <p>Let customers know how to pay you and anything else they should remember.</p>
        </div>
        <label>
          <span>Bank / payment details</span>
          <textarea v-model="form.bankDetails" rows="4" class="input-control textarea" placeholder="Bank name, IBAN, SWIFT, etc." />
        </label>
        <label>
          <span>Invoice footer note</span>
          <textarea v-model="form.footerNote" rows="3" class="input-control textarea" placeholder="Thank you message, payment instructions, etc." />
        </label>
      </section>

      <div class="actions">
        <NuxtLink to="/dashboard" class="btn btn-ghost">Cancel</NuxtLink>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <span v-if="saving">Saving…</span>
          <span v-else>Save settings</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'nuxt/app'

declare function definePageMeta(meta: any): void

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const $fetch = useRequestFetch()

const loading = ref(true)
const saving = ref(false)
const form = ref({
  name: '',
  logoUrl: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  bankDetails: '',
  footerNote: ''
})

const loadSettings = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/settings/company')
    form.value = {
      name: data.name || '',
      logoUrl: data.logoUrl || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      bankDetails: data.bankDetails || '',
      footerNote: data.footerNote || ''
    }
  } catch (error) {
    console.error('Failed to load company settings', error)
    alert('Unable to load company settings.')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    await $fetch('/api/settings/company', { method: 'PUT', body: form.value })
    alert('Company settings saved successfully!')
    await router.push('/dashboard')
  } catch (error: any) {
    console.error('Failed to save company settings', error)
    alert(error.data?.message || 'Failed to save settings')
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.section-header h2 {
  margin: 0;
  font-size: 1.2rem;
}
.section-header p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}
.form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.form-grid label,
label {
  display: grid;
  gap: 8px;
}
label span {
  font-weight: 600;
}
.textarea {
  border-radius: var(--radius-md);
  padding: 0.75rem;
  resize: vertical;
}
.grid-span {
  grid-column: 1 / -1;
}
.logo-preview {
  display: grid;
  gap: 8px;
  color: var(--text-muted);
}
.logo-preview img {
  height: 60px;
  object-fit: contain;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}
</style>


