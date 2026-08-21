// app/api/watchlist/reorder/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { ITEM_MAP, TIER_KEYS } from '@/lib/marvel-watchlist-data'

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
    const { tier, itemIds } = body

    if (tier !== null && !TIER_KEYS.includes(tier)) {
      return NextResponse.json(
        { error: 'tier must be a known tier key, or null for the Unranked pool' },
        { status: 400 }
      )
    }

    if (!Array.isArray(itemIds) || itemIds.some((id) => typeof id !== 'string' || !(id in ITEM_MAP))) {
      return NextResponse.json(
        { error: 'itemIds must be an array of known watchlist item ids' },
        { status: 400 }
      )
    }

    if (tier === 'best' && itemIds.length > 1) {
      return NextResponse.json(
        { error: '"best" only holds a single item' },
        { status: 400 }
      )
    }

    // itemIds is the complete, ordered membership of this tier (or Unranked) after the drag —
    // set tier + a sequential order for every item in it, left to right.
    const results = await prisma.$transaction(
      itemIds.map((itemId: string, index: number) =>
        prisma.watchedItem.updateMany({
          where: { userId: payload.userId, itemId },
          data: { tier, order: index },
        })
      )
    )

    if (itemIds.length > 0 && results.every((r) => r.count === 0)) {
      return NextResponse.json(
        { error: 'None of these items are marked watched yet' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/watchlist/reorder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
