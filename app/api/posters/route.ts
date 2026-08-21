// app/api/posters/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { posterUrl } from '@/lib/tmdb'

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

    const cached = await prisma.posterCache.findMany({
      where: { posterPath: { not: null } },
    })

    const posters: Record<string, string> = {}
    for (const entry of cached) {
      if (entry.posterPath) {
        posters[entry.itemId] = posterUrl(entry.posterPath)
      }
    }

    return NextResponse.json({ posters })
  } catch (error) {
    console.error('GET /api/posters error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
