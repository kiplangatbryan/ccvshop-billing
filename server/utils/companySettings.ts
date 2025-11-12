import type { ModifyResult } from 'mongodb'
import { getCollection } from './db'
import { logger } from './logger'
import { recordOperation } from './operationsLog'

export interface CompanySettings {
  name: string
  logoUrl?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  bankDetails?: string
  footerNote?: string
  updatedAt: Date
  updatedBy?: string
}

const SETTINGS_DOC_ID = 'singleton'

export async function getCompanySettings() {
  try {
    const collection = await getCollection<CompanySettings & { _id: string }>('company_settings')
    const defaults: CompanySettings & { _id: string } = {
      _id: SETTINGS_DOC_ID,
      name: 'Zargar Invoice',
      email: 'info@zargar-invoice.local',
      updatedAt: new Date()
    }

    await collection.updateOne(
      { _id: SETTINGS_DOC_ID } as any,
      { $setOnInsert: defaults },
      { upsert: true }
    )

    const settings = await collection.findOne({ _id: SETTINGS_DOC_ID } as any)

    return settings ?? defaults
  } catch (error) {
    logger.error('Failed to load company settings', { error })
    throw error
  }
}

export async function updateCompanySettings(
  payload: Partial<Omit<CompanySettings, 'updatedAt'>> & { updatedBy?: string }
) {
  const collection = await getCollection<CompanySettings & { _id: string }>('company_settings')
  const updatedAt = new Date()
  const current = await getCompanySettings()
  const { _id, ...rest } = current || { _id: SETTINGS_DOC_ID }

  const newValues: CompanySettings & { _id: string } = {
    _id: SETTINGS_DOC_ID,
    ...rest,
    ...payload,
    updatedAt
  }

  const { _id: _, ...setValues } = newValues

  await collection.updateOne({ _id: SETTINGS_DOC_ID } as any, { $set: setValues }, { upsert: true })

  await recordOperation({
    action: 'settings:update',
    entityType: 'settings',
    entityId: SETTINGS_DOC_ID,
    userId: payload.updatedBy,
    metadata: {
      fields: Object.keys(payload)
    }
  })

  return newValues
}


