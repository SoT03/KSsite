// app/api/survey/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { ITEM_MAP } from '@/lib/marvel-watchlist-data'
import { CHARACTERS } from '@/lib/marvel-characters'
import { SURVEY_QUESTION_MAP, CUSTOM_PREFIX, CUSTOM_MAX_LENGTH, type SurveyQuestion } from '@/lib/marvel-survey-data'

const CHARACTER_GENDER = new Map(CHARACTERS.map((c) => [c.id, c.gender]))

function isValidAnswer(question: SurveyQuestion, value: string): boolean {
  if (question.allowCustom && value.startsWith(CUSTOM_PREFIX)) {
    const text = value.slice(CUSTOM_PREFIX.length).trim()
    return text.length > 0 && text.length <= CUSTOM_MAX_LENGTH
  }
  switch (question.kind) {
    case 'movie':
      return ITEM_MAP[value]?.mediaType === 'movie'
    case 'series':
      return ITEM_MAP[value]?.mediaType === 'tv'
    case 'character-m':
      return CHARACTER_GENDER.get(value) === 'm'
    case 'character-f':
      return CHARACTER_GENDER.get(value) === 'f'
    case 'options':
      return (question.options ?? []).some((o) => o.id === value)
  }
}

// Returns every user's answers (not just the caller's) so anyone logged in can
// compare. Spoiler filtering happens client-side, against the viewer's own
// watch progress.
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

    const answers = await prisma.surveyAnswer.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    })

    // Grouped per person, so the results view can show each respondent's full card.
    const people = new Map<string, { userId: string; name: string; mine: boolean; answers: Record<string, string> }>()
    for (const a of answers) {
      if (!(a.questionId in SURVEY_QUESTION_MAP)) continue
      let person = people.get(a.userId)
      if (!person) {
        person = { userId: a.userId, name: a.user.name, mine: a.userId === payload.userId, answers: {} }
        people.set(a.userId, person)
      }
      person.answers[a.questionId] = a.value
    }

    return NextResponse.json({ people: [...people.values()] })
  } catch (error) {
    console.error('GET /api/survey error:', error)
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
    const { questionId, value } = body

    const question = typeof questionId === 'string' ? SURVEY_QUESTION_MAP[questionId] : undefined
    if (!question) {
      return NextResponse.json(
        { error: 'questionId must be a known survey question id' },
        { status: 400 }
      )
    }

    // null clears the answer.
    if (value === null) {
      await prisma.surveyAnswer.deleteMany({
        where: { userId: payload.userId, questionId },
      })
      return NextResponse.json({ success: true })
    }

    if (typeof value !== 'string' || !isValidAnswer(question, value)) {
      return NextResponse.json(
        { error: 'value is not a valid answer for this question' },
        { status: 400 }
      )
    }

    await prisma.surveyAnswer.upsert({
      where: { userId_questionId: { userId: payload.userId, questionId } },
      create: { userId: payload.userId, questionId, value },
      update: { value },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/survey error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
