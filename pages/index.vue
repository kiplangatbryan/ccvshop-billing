<template>
  <div></div>
</template>

<script setup lang="ts">
// Redirect to invoices page if authenticated, otherwise to login
const { user } = useAuth()
const router = useRouter()

onMounted(() => {
  if (user.value) {
    router.push('/invoices')
  } else {
    router.push('/login')
  }
})
</script>




