export const useAuth = () => {
  const user = useState('user', () => null as any)
  const token = useState('token', () => null as string | null)

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      user.value = response.user
      token.value = response.token
      return response
    } catch (error: any) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { name, email, password }
      })
      user.value = response.user
      token.value = response.token
      return response
    } catch (error: any) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      token.value = null
      await navigateTo('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const checkAuth = async () => {
    try {
      // Check if user is authenticated by trying to fetch user data
      // This would require a /me endpoint, but for now we'll rely on cookies
      return true
    } catch {
      return false
    }
  }

  return {
    user: readonly(user),
    token: readonly(token),
    login,
    register,
    logout,
    checkAuth
  }
}







