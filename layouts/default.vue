<template>
  <div class="app-wrapper">
    <header class="top-nav">
      <NuxtLink to="/invoices" class="brand">
        <span class="brand-mark">ZI</span>
        <span class="brand-name">Zargar</span>
      </NuxtLink>

      <nav class="nav-links">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          active-class="nav-link-active"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="nav-actions" v-if="user">
        <span class="user-label">Hi, {{ user.name || 'System Admin' }}</span>
        <button class="btn-ghost" @click="handleLogout">Log out</button>
      </div>
    </header>

    <main class="page-container">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from '#imports'
import { useAuth } from '~/composables/useAuth'

const { user, logout } = useAuth()
const router = useRouter()

const navItems = [
  { label: 'Invoices', to: '/invoices' },
  { label: 'Create Invoice', to: '/invoices/create' },
  { label: 'Company Settings', to: '/settings/company' }
]

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}
</script>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  background: var(--app-bg);
  display: flex;
  flex-direction: column;
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 40px;
  background: var(--surface);
  border-bottom: 1px solid var(--border-color);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  color: var(--text-main);
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #ffffff;
  font-weight: 700;
}

.brand-name {
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1 1 auto;
  justify-content: center;
}

.nav-link {
  font-weight: 600;
  color: var(--text-muted);
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.nav-link:hover {
  color: var(--text-main);
}

.nav-link-active {
  color: var(--text-main);
  border-color: var(--primary);
}

.nav-actions,
.nav-auth {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.user-label {
  font-weight: 600;
  color: var(--text-main);
}

.link {
  font-weight: 600;
  color: var(--text-main);
}

.page-container {
  flex: 1;
  width: 100%;
}

@media (max-width: 960px) {
  .top-nav {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  .nav-links {
    order: 3;
    justify-content: flex-start;
    gap: 18px;
    width: 100%;
  }
  .nav-actions,
  .nav-auth {
    align-self: flex-end;
  }
}
</style>


