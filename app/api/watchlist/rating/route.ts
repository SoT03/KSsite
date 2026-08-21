// app/api/watchlist/rating/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { ITEM_MAP } from '@/lib/marvel-watchlist-data'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    const payload = token ? verifyToken(token) : null

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { itemId, rating } = body

    if (!itemId || typeof itemId !== 'string' || !(itemId in ITEM_MAP)) {
      return NextResponse.json(
        { error: 'itemId must be a known watchlist item id' },
        { status: 400 }
      )
    }

    // null clears the rating; otherwise it must be an integer 1-5.
    if (rating !== null && (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'rating must be an integer 1-5, or null to clear it' },
        { status: 400 }
      )
    }

    // A rating only makes sense for something already marked watched.
    const { count } = await prisma.watchedItem.updateMany({
      where: { userId: payload.userId, itemId },
      data: { rating },
    })

    if (count === 0) {
      return NextResponse.json(
        { error: 'Item must be marked watched before it can be rated' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/watchlist/rating error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
