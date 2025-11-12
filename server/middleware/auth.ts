import { verifyToken } from '../utils/auth'
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  const log = logger.child({
    context: {
      middleware: 'auth',
      url
    }
  })

  // Only enforce auth on API routes
  if (!url.startsWith('/api/')) {
    return
  }

  // Skip auth for login/register endpoints
  if (url.startsWith('/api/auth/login') || url.startsWith('/api/auth/register')) {
    return
  }

  // Skip auth for public assets
  if (url.startsWith('/_nuxt') || url.startsWith('/api/ccv/products')) {
    return
  }

  const token = getCookie(event, 'auth-token') || 
                getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!token) {
    log.warn('Missing authentication token')
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const decoded = verifyToken(token)
  
  if (!decoded) {
    log.warn('Invalid authentication token')
    throw createError({
      statusCode: 401,
      message: 'Invalid token'
    })
  }

  event.context.user = decoded
  log.debug('Authenticated request', { context: { userId: decoded.userId } })
})


