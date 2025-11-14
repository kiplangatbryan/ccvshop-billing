<template>
  <div class="auth-wrapper">
    <header class="auth-nav">
      <NuxtLink to="/" class="auth-brand">
        <span class="brand-mark">ZI</span>
        <span>Z|Invoice</span>
      </NuxtLink>
      <div class="auth-links">
        <NuxtLink to="/login" class="link">Log in</NuxtLink>
      </div>
    </header>

    <main class="auth-main">
      <div class="auth-card">
        <h1>Create your account</h1>
        <p>Sign up to build invoices, manage clients, and track payments.</p>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div>
            <label for="name">Full name</label>
            <VTextField
              id="name"
              v-model="name"
              type="text"
              variant="outlined"
              density="comfortable"
              color="primary"
              prepend-inner-icon="mdi-account-outline"
              class="tw-rounded-xl"
              placeholder="Jane Doe"
              autocomplete="name"
              required
            />
          </div>

          <div>
            <label for="email">Email address</label>
            <VTextField
              id="email"
              v-model="email"
              type="email"
              variant="outlined"
              density="comfortable"
              color="primary"
              prepend-inner-icon="mdi-email-outline"
              class="tw-rounded-xl"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>

          <div>
            <label for="password">Password</label>
            <VTextField
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              color="primary"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              @click:append-inner="showPassword = !showPassword"
              class="tw-rounded-xl"
              placeholder="Create a strong password"
              autocomplete="new-password"
              required
            />
          </div>

          <VAlert v-if="error" type="error" variant="tonal" class="tw-rounded-2xl">
            {{ error }}
          </VAlert>

          <VBtn type="submit" color="primary" block class="tw-rounded-full tw-font-semibold tw-py-3" :loading="loading">
            <span v-if="loading">Creating account…</span>
            <span v-else>Sign up</span>
          </VBtn>
        </form>

        <p class="auth-footer">
          Already have an account?
          <NuxtLink to="/login" class="link">Log in</NuxtLink>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta, useRouter } from '#imports'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: false })

const { register } = useAuth()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const handleRegister = async () => {
  loading.value = true
  error.value = ''

  try {
    await register(name.value, email.value, password.value)
    await router.push('/dashboard')
  } catch (err: any) {
    error.value = err.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  background: var(--app-bg);
  display: flex;
  flex-direction: column;
}
.auth-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 40px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-color);
}
.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}
.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--primary);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.auth-links {
  display: inline-flex;
  gap: 16px;
  font-weight: 600;
}
.auth-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 16px;
}
.auth-card {
  width: 100%;
  max-width: 440px;
  background: var(--surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 36px;
  box-shadow: 0 24px 40px -32px rgba(15, 23, 42, 0.15);
  display: grid;
  gap: 24px;
}
.auth-card h1 {
  font-size: 1.75rem;
  margin: 0;
}
.auth-card p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}
.auth-form {
  display: grid;
  gap: 20px;
}
.auth-form label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}
.password-field {
  position: relative;
}
.password-field button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 0;
  display: inline-flex;
}
.auth-error {
  padding: 12px 14px;
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}
.auth-footer {
  text-align: center;
  color: var(--text-muted);
}
@media (max-width: 640px) {
  .auth-nav {
    padding: 16px 24px;
  }
  .auth-card {
    padding: 28px;
  }
}
</style>


