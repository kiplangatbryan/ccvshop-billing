import { MongoClient, Db, ObjectId, type Document } from 'mongodb'
import { logger } from './logger'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectToDatabase(): Promise<Db> {
  const config = useRuntimeConfig()
  const dbLogger = logger.child({ context: { service: 'mongodb' } })
  
  if (db) {
    return db
  }

  try {
    if (!client) {
      client = new MongoClient(config.mongodbUri)
      await client.connect()
      dbLogger.info('Connected to MongoDB')
    }
    
    db = client.db()
    return db
  } catch (error) {
    dbLogger.error('Failed to connect to MongoDB', { error })
    throw error
  }
}

export async function getCollection<T extends Document = Document>(name: string) {
  const database = await connectToDatabase()
  return database.collection<T>(name)
}

export function toObjectId(id: string | undefined | null): ObjectId | null {
  if (!id) {
    return null
  }
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}


