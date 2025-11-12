import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getCollection } from './db'

export interface User {
  _id?: string
  email: string
  password: string
  name: string
  role?: 'admin' | 'user'
  createdAt?: Date
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: Omit<User, 'password'>): string {
  const config = useRuntimeConfig()
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role || 'user'
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): any {
  const config = useRuntimeConfig()
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch (error) {
    return null
  }
}

export async function createUser(userData: Omit<User, '_id' | 'createdAt'>): Promise<User> {
  const users = await getCollection<User>('users')
  const hashedPassword = await hashPassword(userData.password)
  
  const newUser: User = {
    ...userData,
    password: hashedPassword,
    role: userData.role || 'admin',
    createdAt: new Date()
  }
  
  const result = await users.insertOne(newUser)
  return { ...newUser, _id: result.insertedId.toString() }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await getCollection<User>('users')
  return await users.findOne({ email })
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await getCollection<User>('users')
  return await users.findOne({ _id: id as any })
}


