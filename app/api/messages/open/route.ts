// app/api/messages/open/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const payload = verifyToken(token || '')

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId jest wymagane' },
        { status: 400 }
      )
    }

    // Get the message to check the day
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Nie znaleziono wiadomości' },
        { status: 404 }
      )
    }

    // Check if already opened
    const existingOpening = await prisma.boxOpening.findUnique({
      where: {
        userId_messageId: {
          userId: payload.userId,
          messageId,
        },
      },
    })

    if (existingOpening) {
      return NextResponse.json(
        { error: 'Pudełko zostało już otwarte' },
        { status: 400 }
      )
    }

    // One box per day, regardless of which box it is
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const openedToday = await prisma.boxOpening.findFirst({
      where: {
        userId: payload.userId,
        openedAt: { gte: startOfToday },
      },
    })

    if (openedToday) {
      return NextResponse.json(
        { error: 'Otworzyłaś już dzisiaj pudełko. Wróć jutro!' },
        { status: 403 }
      )
    }

    // Create the opening record
    const boxOpening = await prisma.boxOpening.create({
      data: {
        userId: payload.userId,
        messageId,
      },
    })

    return NextResponse.json(boxOpening, { status: 201 })
  } catch (error) {
    console.error('POST /api/messages/open error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
