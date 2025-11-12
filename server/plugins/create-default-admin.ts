import { createUser, findUserByEmail } from '../utils/auth'
import { logger } from '../utils/logger'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const email = config.defaultAdminEmail
  const password = config.defaultAdminPassword
  const name = config.defaultAdminName || 'Admin'

  if (!email || !password) {
    logger.warn('Skipping default admin creation: missing credentials', {
      context: { plugin: 'seed-admin' }
    })
    return
  }

  try {
    const existing = await findUserByEmail(email)
    if (existing) {
      logger.debug('Default admin already exists, skipping creation', {
        context: { plugin: 'seed-admin', email }
      })
      return
    }

    await createUser({
      email,
      password,
      name,
      role: 'admin'
    })

    logger.info('Created default admin user', {
      context: { plugin: 'seed-admin', email }
    })
  } catch (error) {
    logger.error('Failed to create default admin user', {
      context: { plugin: 'seed-admin', email },
      error
    })
  }
})


