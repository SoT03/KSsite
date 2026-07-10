// lib/auth.ts

import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

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
