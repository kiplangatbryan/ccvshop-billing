import { getCompanySettings } from '../../utils/companySettings'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const settings = await getCompanySettings()
    return settings
  } catch (error: any) {
    logger.error('Failed to fetch company settings', {
      context: { route: '/api/settings/company', method: 'GET' },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch company settings'
    })
  }
})


