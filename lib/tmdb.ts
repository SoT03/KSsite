// lib/tmdb.ts
//
// Minimal TMDB (themoviedb.org) v3 API client used to resolve poster art for
// the Marvel watchlist. Server-side only — TMDB_API_KEY must never reach the
// client bundle.

const TMDB_API_BASE = 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200'

interface TmdbSearchResult {
  id: number
  title?: string // movies
  name?: string // tv
  poster_path: string | null
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[]
}

export function getTmdbApiKey(): string | null {
  const key = process.env.TMDB_API_KEY
  return key && key.trim().length > 0 ? key.trim() : null
}

/**
 * Searches TMDB for a title and returns the best match, or null if no API
 * key is configured, the request fails, or nothing matched.
 *
 * TMDB ranks by relevance/popularity, not exact match — a short franchise
 * title like "Spider-Man" or "X-Men" reliably surfaces a newer, more
 * popular, differently-titled entry ahead of the exact match we want (e.g.
 * "Spider-Man: Brand New Day" outranks the 2002 "Spider-Man"). So: prefer
 * the first exact case-insensitive title match; only fall back to the
 * top-ranked result when nothing matches exactly.
 */
export async function searchTmdb(
  title: string,
  mediaType: 'movie' | 'tv',
  apiKey: string
): Promise<{ tmdbId: number; posterPath: string | null } | null> {
  const url = new URL(`${TMDB_API_BASE}/search/${mediaType}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('query', title)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`TMDB search failed for "${title}" (${mediaType}): ${response.status}`)
  }

  const data = (await response.json()) as TmdbSearchResponse
  const results = data.results ?? []
  if (results.length === 0) return null

  const normalized = title.trim().toLowerCase()
  const exact = results.find((r) => (r.title ?? r.name ?? '').trim().toLowerCase() === normalized)
  const best = exact ?? results[0]

  return { tmdbId: best.id, posterPath: best.poster_path }
}

/**
 * Fetches poster art for a known TMDB id directly, bypassing search. Used
 * for the handful of titles ("Daredevil", "The Defenders", ...) where an
 * unrelated older show shares the exact same title on TMDB and search-based
 * matching can't reliably tell them apart.
 */
export async function getPosterById(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  apiKey: string
): Promise<string | null> {
  const url = new URL(`${TMDB_API_BASE}/${mediaType}/${tmdbId}`)
  url.searchParams.set('api_key', apiKey)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`TMDB lookup failed for ${mediaType}#${tmdbId}: ${response.status}`)
  }

  const data = (await response.json()) as { poster_path: string | null }
  return data.poster_path
}

export function posterUrl(posterPath: string): string {
  return `${TMDB_IMAGE_BASE}${posterPath}`
}
