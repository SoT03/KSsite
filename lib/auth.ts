// lib/auth.ts

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const BCRYPT_ROUNDS = 10

export interface TokenPayload {
  userId: string
  email: string
  role: 'admin' | 'user'
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
