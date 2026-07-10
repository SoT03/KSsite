// app/api/messages/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const messages = await prisma.message.findMany({
      where: { year },
      orderBy: { dayNumber: 'asc' },
    })

    // Get opened boxes for current user
    const openedBoxes = await prisma.boxOpening.findMany({
      where: { userId: payload.userId },
      include: { message: true },
    })

    const enrichedMessages = messages.map((msg) => ({
      ...msg,
      opened: openedBoxes.some((box) => box.messageId === msg.id),
    }))

    return NextResponse.json({
      messages: enrichedMessages,
      openedBoxes: openedBoxes.map((box) => ({
        messageId: box.messageId,
        openedAt: box.openedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const payload = verifyToken(token || '')

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { dayNumber, content, year } = body

    if (!dayNumber || !content) {
      return NextResponse.json(
        { error: 'dayNumber and content are required' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        dayNumber: parseInt(dayNumber),
        content,
        year,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    // Unique constraint on [year, dayNumber] — relying on this instead of a
    // separate findUnique pre-check saves a DB round trip on every add.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A message already exists for this day' },
        { status: 400 }
      )
    }
    console.error('POST /api/messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
