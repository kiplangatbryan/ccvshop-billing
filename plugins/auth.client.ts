export default defineNuxtPlugin({
  name: 'auth-restore',
  enforce: 'pre', // Run before other plugins
  async setup() {
    // Only run on client side
    if (process.server) {
      return
    }

    // Try to restore user from cookie by calling /api/auth/me
    // Use $fetch with credentials to ensure cookies are sent
    try {
      const response = await $fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response && response.user) {
        // Restore user and token state
        const userState = useState('user', () => null as any)
        const tokenState = useState('token', () => null as string | null)
        userState.value = response.user
        tokenState.value = response.token
      }
    } catch (error: any) {
      // User is not authenticated, ensure state is cleared
      const userState = useState('user', () => null as any)
      const tokenState = useState('token', () => null as string | null)
      userState.value = null
      tokenState.value = null
    }
  }
})

