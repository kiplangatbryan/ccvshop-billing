export default defineNuxtRouteMiddleware(async (to, from) => {
  // Allow access to login/register pages
  if (to.path === '/login' || to.path === '/register') {
    return
  }
  
  // On client side, restore auth from cookie if not already loaded
  const userState = useState('user', () => null as any)
  
  if (process.client) {
    // If user is not loaded, restore from cookie directly
    if (!userState.value) {
      try {
        const response = await $fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (response && response.user) {
          // Set user state immediately
          userState.value = response.user
          const tokenState = useState('token', () => null as string | null)
          tokenState.value = response.token
          // Auth restored successfully, allow navigation to continue
          return
        }
      } catch (error: any) {
        // Auth failed, will redirect below
      }
    } else {
      // User already loaded, allow navigation
      return
    }
  }
  
  // Only redirect to login if we're on client and user is still not loaded
  if (process.client && !userState.value) {
    return navigateTo('/login')
  }
  
  // On server side, if no user, redirect to login
  if (!userState.value) {
    return navigateTo('/login')
  }
})






