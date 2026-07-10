// app/api/anniversary/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let anniversary = await prisma.anniversaryDate.findFirst()

    if (!anniversary) {
      // Create default anniversary if it doesn't exist
      // Change this date to your actual anniversary
      const defaultDate = new Date('2020-01-15')
      anniversary = await prisma.anniversaryDate.create({
        data: { date: defaultDate },
      })
    }

    return NextResponse.json({ date: anniversary.date.toISOString() })
  } catch (error) {
    console.error('GET /api/anniversary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json(
        { error: 'date is required' },
        { status: 400 }
      )
    }

    const anniversary = await prisma.anniversaryDate.findFirst()

    if (!anniversary) {
      const created = await prisma.anniversaryDate.create({
        data: { date: new Date(date) },
      })
      return NextResponse.json(created)
    }

    const updated = await prisma.anniversaryDate.update({
      where: { id: anniversary.id },
      data: { date: new Date(date) },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/anniversary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
