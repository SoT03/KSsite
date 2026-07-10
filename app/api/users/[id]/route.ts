// app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, hashPassword } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const payload = token ? verifyToken(token) : null

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, password } = body

    if (email !== undefined && !email) {
      return NextResponse.json(
        { error: 'Username/email cannot be empty' },
        { status: 400 }
      )
    }

    if (password !== undefined && password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(password && { password: await hashPassword(password) }),
      },
      select: { id: true, email: true, name: true, role: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('PUT /api/users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
