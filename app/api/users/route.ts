// app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, hashPassword } from '@/lib/auth'

const VALID_ROLES = ['admin', 'user', 'marvel']

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const payload = token ? verifyToken(token) : null

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      orderBy: { role: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const payload = token ? verifyToken(token) : null

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Imię, nazwa użytkownika/e-mail i hasło są wymagane' },
        { status: 400 }
      )
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Hasło musi mieć co najmniej 4 znaki' },
        { status: 400 }
      )
    }

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Nieprawidłowa rola' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: role || 'user',
      },
      select: { id: true, email: true, name: true, role: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    // Unique constraint on email.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Konto z tą nazwą użytkownika/e-mailem już istnieje' },
        { status: 400 }
      )
    }
    console.error('POST /api/users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
