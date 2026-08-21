// app/api/watchlist/tier/route.ts

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
    const { itemId, tier } = body

    if (!itemId || typeof itemId !== 'string' || !(itemId in ITEM_MAP)) {
      return NextResponse.json(
        { error: 'itemId must be a known watchlist item id' },
        { status: 400 }
      )
    }

    if (tier !== null && !TIER_KEYS.includes(tier)) {
      return NextResponse.json(
        { error: 'tier must be a known tier key, or null to unrank' },
        { status: 400 }
      )
    }

    // "best" is a single reserved slot — placing a new item there bumps
    // whatever previously held it back to Unranked, in the same transaction
    // so two concurrent drops can never leave two items both marked "best".
    const ops = []
    if (tier === 'best') {
      ops.push(
        prisma.watchedItem.updateMany({
          where: { userId: payload.userId, tier: 'best', itemId: { not: itemId } },
          data: { tier: null },
        })
      )
    }
    ops.push(
      prisma.watchedItem.updateMany({
        where: { userId: payload.userId, itemId },
        data: { tier },
      })
    )
    const results = await prisma.$transaction(ops)
    const updateResult = results[results.length - 1]

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: 'Item must be marked watched before it can be tiered' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/watchlist/tier error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
