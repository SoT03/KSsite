// proxy.ts
//
// Runs before every request. Its only job here is to keep the "marvel" role
// confined to the Marvel watchlist page (and the API routes it depends on) —
// everything else redirects (pages) or 403s (APIs). Every other role passes
// through untouched; per-page/per-route auth checks still apply as before.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const MARVEL_ALLOWED_PAGE_PREFIXES = ['/marvel-watchlist', '/login']
const MARVEL_ALLOWED_API_PREFIXES = ['/api/auth', '/api/watchlist', '/api/posters']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value
  const payload = token ? verifyToken(token) : null

  if (payload?.role !== 'marvel') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    const allowed = MARVEL_ALLOWED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }

  const allowedPage = MARVEL_ALLOWED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!allowedPage) {
    return NextResponse.redirect(new URL('/marvel-watchlist', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
