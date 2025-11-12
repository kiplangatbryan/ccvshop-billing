export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useAuth()
  
  // Allow access to login/register pages
  if (to.path === '/login' || to.path === '/register') {
    return
  }
  
  // Redirect to login if not authenticated
  if (!user.value) {
    return navigateTo('/login')
  }
})




