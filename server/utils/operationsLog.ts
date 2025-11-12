import { getCollection } from './db'
import { logger } from './logger'

export type OperationAction =
  | 'invoice:create'
  | 'invoice:update'
  | 'invoice:delete'
  | 'invoice:payment-recorded'
  | 'invoice:status-change'
  | 'invoice:email-sent'
  | 'user:create'
  | 'auth:login'
  | 'auth:logout'
  | 'settings:update'
  | 'other'

export interface OperationLog {
  _id?: string
  action: OperationAction
  entityType: 'invoice' | 'user' | 'payment' | 'settings' | 'system' | 'other'
  entityId?: string
  userId?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export async function recordOperation(log: Omit<OperationLog, '_id' | 'createdAt'>) {
  try {
    const operations = await getCollection<OperationLog>('operation_logs')
    await operations.insertOne({
      ...log,
      createdAt: new Date()
    })
  } catch (error) {
    logger.error('Failed to record operation log', {
      context: { action: log.action, entityId: log.entityId, entityType: log.entityType },
      error
    })
  }
}


