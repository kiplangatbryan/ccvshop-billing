<template>
  <div class="app-wrapper">
    <header class="top-nav">
      <NuxtLink to="/invoices" class="brand">
        <span class="brand-mark">Z|</span>
        <span class="brand-name">Invoice</span>
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
        <VBtn icon variant="text" color="primary" class="tw-relative tw-mr-4">
          <VIcon size="22">mdi-bell-outline</VIcon>
          <span class="tw-absolute tw-top-2 tw-right-2 tw-w-2 tw-h-2 tw-rounded-full tw-bg-red-500"></span>
        </VBtn>
        <VMenu offset-y>
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="text"
              class="tw-rounded-full tw-pl-2 tw-pr-3 tw-flex tw-items-center tw-space-x-5 tw-hover:bg-gray-100 tw-transition-colors"
            >
              <VAvatar color="success" size="34">
                <span class="tw-text-white tw-font-semibold">{{ userInitials }}</span>
              </VAvatar>
              <div class="tw-flex tw-flex-col tw-items-start tw-leading-tight">
                <span class="tw-text-sm tw-font-semibold tw-text-gray-900">{{ brandName }}</span>
                <span class="tw-text-xs tw-text-gray-400">Brand</span>
              </div>
              <VIcon size="18">mdi-chevron-down</VIcon>
            </VBtn>
          </template>
          <VList>
            <VListItem @click="handleLogout">
              <VListItemTitle>Log out</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
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
import { VAvatar, VBtn, VIcon, VList, VListItem, VListItemTitle, VMenu } from 'vuetify/components'

const { user, logout } = useAuth()
const router = useRouter()

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Invoices', to: '/invoices' },
  { label: 'Create Invoice', to: '/invoices/create' },
  { label: 'Company Settings', to: '/settings/company' }
]

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}

const userInitials = computed(() => {
  const name = user.value?.name || 'Z|Invoice'
  const words = name.trim().split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
})

const brandName = computed(() => user.value?.name || 'Z|Invoice')
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
  padding: 10px 40px;
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


