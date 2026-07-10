// app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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
