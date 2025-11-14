import { findUserByEmail, verifyPassword, generateToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = body

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email and password are required'
      })
    }

    const user = await findUserByEmail(email)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      })
    }

    const isValid = await verifyPassword(password, user.password)
    
    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      })
    }

    const token = generateToken(user)
    
    // Set cookie with proper options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }
    
    setCookie(event, 'auth-token', token, cookieOptions)
    
    // Debug: Log cookie setting
    console.log('=== Login: Setting cookie ===')
    console.log('Cookie options:', cookieOptions)
    console.log('Token length:', token.length)

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
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Login failed'
    })
  }
})


