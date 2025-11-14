import { getCollection } from './db'
import { logger } from './logger'

export interface Sequence {
  _id?: string
  name: string
  value: number
  prefix?: string
  suffix?: string
  padding?: number
  updatedAt: Date
}

/**
 * Get the next value in a sequence and increment it
 * @param sequenceName - The name of the sequence (e.g., 'invoice')
 * @param prefix - Optional prefix for the sequence (e.g., 'INV-')
 * @param suffix - Optional suffix for the sequence
 * @param padding - Optional padding for the number (e.g., 6 for 000001)
 * @returns The formatted sequence value (e.g., 'INV-000001')
 */
export async function getNextSequence(
  sequenceName: string,
  prefix: string = '',
  suffix: string = '',
  padding: number = 6
): Promise<string> {
  try {
    const sequences = await getCollection<Sequence>('sequences')
    
    // Ensure sequence exists, create if it doesn't
    const existing = await sequences.findOne({ name: sequenceName })
    if (!existing) {
      await sequences.insertOne({
        name: sequenceName,
        value: 0,
        prefix: prefix || '',
        suffix: suffix || '',
        padding: padding || 6,
        updatedAt: new Date()
      })
    }

    // Increment the sequence value atomically
    const result = await sequences.findOneAndUpdate(
      { name: sequenceName },
      {
        $inc: { value: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error(`Failed to increment sequence: ${sequenceName}`)
    }

    // Format the number with padding
    const paddedNumber = String(result.value).padStart(result.padding || padding, '0')
    
    // Combine prefix, number, and suffix
    const formatted = `${result.prefix || prefix}${paddedNumber}${result.suffix || suffix}`

    logger.debug('Generated sequence value', {
      sequenceName,
      value: result.value,
      formatted
    })

    return formatted
  } catch (error: any) {
    logger.error('Failed to get next sequence', {
      sequenceName,
      error
    })
    throw error
  }
}

/**
 * Get the current sequence value without incrementing
 */
export async function getCurrentSequence(sequenceName: string): Promise<Sequence | null> {
  try {
    const sequences = await getCollection<Sequence>('sequences')
    return await sequences.findOne({ name: sequenceName })
  } catch (error: any) {
    logger.error('Failed to get current sequence', {
      sequenceName,
      error
    })
    return null
  }
}

/**
 * Reset a sequence to a specific value
 */
export async function resetSequence(
  sequenceName: string,
  value: number
): Promise<void> {
  try {
    const sequences = await getCollection<Sequence>('sequences')
    await sequences.updateOne(
      { name: sequenceName },
      {
        $set: {
          value,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
  } catch (error: any) {
    logger.error('Failed to reset sequence', {
      sequenceName,
      value,
      error
    })
    throw error
  }
}

