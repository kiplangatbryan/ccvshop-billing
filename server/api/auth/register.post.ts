import { createUser, findUserByEmail, generateToken } from '../../utils/auth'
import { logger } from '../../utils/logger'
import { recordOperation } from '../../utils/operationsLog'

export default defineEventHandler(async (event) => {
  let requestEmail: string | undefined
  try {
    const body = await readBody(event)
    const { email, password, name } = body
    requestEmail = email

    if (!email || !password || !name) {
      throw createError({
        statusCode: 400,
        message: 'Email, password, and name are required'
      })
    }

    const existingUser = await findUserByEmail(email)
    
    if (existingUser) {
      throw createError({
        statusCode: 400,
        message: 'User already exists'
      })
    }

    const user = await createUser({ email, password, name, role: 'admin' })
    const token = generateToken(user)
    logger.info('User registered', {
      context: {
        route: '/api/auth/register',
        method: 'POST',
        userId: user._id
      }
    })

    await recordOperation({
      action: 'user:create',
      entityType: 'user',
      entityId: user._id,
      metadata: {
        email: user.email,
        role: user.role
      }
    })
    
    setCookie(event, 'auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return {
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  } catch (error: any) {
    logger.error('Registration failed', {
      context: { route: '/api/auth/register', method: 'POST', email: requestEmail },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Registration failed'
    })
  }
})


