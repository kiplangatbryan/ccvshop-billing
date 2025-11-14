import { verifyToken } from '../../utils/auth'
import { getCollection } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Try to get token from cookie first, then from header
    const cookieToken = getCookie(event, 'auth-token')
    const headerToken = getHeader(event, 'authorization')?.replace('Bearer ', '')
    
    // Also try to parse cookie header manually as fallback
    const cookieHeader = getHeader(event, 'cookie') || ''
    let manualCookieToken: string | undefined
    if (cookieHeader) {
      const match = cookieHeader.match(/auth-token=([^;]+)/)
      if (match) {
        manualCookieToken = match[1]
      }
    }
    
    const token = cookieToken || manualCookieToken || headerToken

    // Debug logging
    console.log('=== /api/auth/me Debug ===')
    console.log('Cookie token (getCookie):', cookieToken ? 'Found' : 'Not found')
    console.log('Cookie token (manual parse):', manualCookieToken ? 'Found' : 'Not found')
    console.log('Header token:', headerToken ? 'Found' : 'Not found')
    console.log('Cookie header present:', cookieHeader ? 'Yes' : 'No')
    console.log('Cookie header value:', cookieHeader ? cookieHeader.substring(0, 200) : 'None')
    console.log('Final token:', token ? 'Found' : 'Not found')

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    console.log('Token found, verifying...')
    const decoded = verifyToken(token)
    
    if (!decoded) {
      console.log('Token verification failed')
      throw createError({
        statusCode: 401,
        message: 'Invalid token'
      })
    }

    console.log('Token verified, userId:', decoded.userId, 'type:', typeof decoded.userId)
    const users = await getCollection('users')
    
    // Try to convert userId to ObjectId if it's a string
    let userIdQuery: any = decoded.userId
    if (typeof decoded.userId === 'string') {
      try {
        const { toObjectId } = await import('../../utils/db')
        const objectId = toObjectId(decoded.userId)
        if (objectId) {
          userIdQuery = objectId
          console.log('Converted userId to ObjectId:', objectId.toString())
        }
      } catch (e) {
        console.log('Failed to convert userId to ObjectId, using string')
      }
    }
    
    console.log('Querying user with:', userIdQuery)
    const user = await users.findOne({ _id: userIdQuery })
    
    if (!user) {
      console.log('User not found in database for userId:', decoded.userId)
      throw createError({
        statusCode: 401,
        message: 'User not found'
      })
    }

    console.log('User found:', user.email)
    
    // Ensure _id is a string for proper serialization
    const userId = user._id ? (typeof user._id === 'object' ? user._id.toString() : String(user._id)) : null
    
    const response = {
      user: {
        _id: userId,
        email: user.email || '',
        name: user.name || '',
        role: user.role || 'user'
      },
      token: token || ''
    }
    
    console.log('Returning response - user._id:', response.user._id, 'email:', response.user.email)
    console.log('Response type check - user._id type:', typeof response.user._id)
    
    // Explicitly set status code to ensure success
    setResponseStatus(event, 200)
    return response
  } catch (error: any) {
    console.log('=== /api/auth/me Error ===')
    console.log('Error statusCode:', error.statusCode)
    console.log('Error message:', error.message)
    console.log('Error stack:', error.stack)
    throw createError({
      statusCode: error.statusCode || 401,
      message: error.message || 'Not authenticated'
    })
  }
})

