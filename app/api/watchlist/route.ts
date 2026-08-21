// app/api/watchlist/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { ITEM_MAP } from '@/lib/marvel-watchlist-data'

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

    const watchedItems = await prisma.watchedItem.findMany({
      where: { userId: payload.userId },
    })

    const tiers: Record<string, string> = {}
    for (const w of watchedItems) {
      if (w.tier != null) tiers[w.itemId] = w.tier
    }

    return NextResponse.json({
      watchedItemIds: watchedItems.map((w) => w.itemId),
      tiers,
    })
  } catch (error) {
    console.error('GET /api/watchlist error:', error)
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

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { itemId, watched } = body

    if (!itemId || typeof itemId !== 'string' || !(itemId in ITEM_MAP)) {
      return NextResponse.json(
        { error: 'itemId must be a known watchlist item id' },
        { status: 400 }
      )
    }

    if (watched) {
      await prisma.watchedItem.upsert({
        where: { userId_itemId: { userId: payload.userId, itemId } },
        create: { userId: payload.userId, itemId },
        update: {},
      })
    } else {
      await prisma.watchedItem.deleteMany({
        where: { userId: payload.userId, itemId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/watchlist error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
