<template>
  <div></div>
</template>

<script setup lang="ts">
// Redirect to dashboard if authenticated, otherwise to login
const { user } = useAuth()
const router = useRouter()

onMounted(() => {
  if (user.value) {
    router.push('/dashboard')
  } else {
    router.push('/login')
  }
})
</script>


