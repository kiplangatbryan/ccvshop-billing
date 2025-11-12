import { updateCompanySettings } from '../../utils/companySettings'
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

    const body = await readBody(event)
    const allowedFields = ['name', 'logoUrl', 'address', 'phone', 'email', 'website', 'bankDetails', 'footerNote']

    const payload = Object.keys(body || {}).reduce<Record<string, any>>((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = body[key]
      }
      return acc
    }, {})

    const updated = await updateCompanySettings({
      ...payload,
      updatedBy: user.userId
    })

    return updated
  } catch (error: any) {
    logger.error('Failed to update company settings', {
      context: { route: '/api/settings/company', method: 'PUT' },
      error
    })
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update company settings'
    })
  }
})


