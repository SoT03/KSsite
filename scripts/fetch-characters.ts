// scripts/fetch-characters.ts
//
// One-time (or re-run-when-needed) script that pulls the main cast of every
// watchlist item from TMDB and writes the merged, de-junked character list to
// lib/marvel-characters.ts, which the survey's character questions use.
// Run with: npm run characters:fetch (after posters:fetch, which caches the TMDB ids it reads)
//
// Re-running regenerates the file from scratch, so hand edits to it are lost —
// put fixes in the tables below instead. Character ids are derived from the
// actor id + display name; if a rerun renames a character, saved survey
// answers pointing at the old id stop resolving.

import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { ITEMS, type WatchItem } from '../lib/marvel-watchlist-data'
import { getTmdbApiKey } from '../lib/tmdb'

const TMDB_API_BASE = 'https://api.themoviedb.org/3'

// How many top-billed cast entries to keep per movie / per TV season. Below
// this the lists are mostly one-line extras nobody would pick as a favourite.
const MOVIE_CAST_LIMIT = 12
const SEASON_CAST_LIMIT = 10

// Character strings containing any of these are crew stand-ins or extras, not characters.
const JUNK_PATTERNS = [/uncredited/i, /\breader\b/i, /stand-?in/i, /\bdouble\b/i, /archive footage/i, /\bhimself\b/i, /\bherself\b/i, /\bnarrator\b/i, /additional voices/i, /on-?set/i]

// Display-name fixes for TMDB credits that name a character by a spoilery or
// unhelpful label. Keyed by the cleaned TMDB character string.
const NAME_OVERRIDES: Record<string, string> = {
  'The Variant': 'Sylvie',
}

// Display-name fixes applied after merging, keyed by "<actor name>|<merged name>" — for
// actors whose credits merge correctly but where the most-used spelling is the wrong headline.
const MERGED_NAME_OVERRIDES: Record<string, string> = {
  'Paul Bettany|Jarvis': 'Vision / J.A.R.V.I.S.',
  'Vin Diesel|Baby Groot': 'Groot',
  'Sean Gunn|Kraglin / Young Rocket': 'Kraglin',
}

// Tokens too generic to prove two credits of the same actor are the same character.
const STOP_TOKENS = new Set(['the', 'man', 'woman', 'doctor', 'dr', 'mr', 'mrs', 'ms', 'young', 'old', 'older', 'younger', 'agent', 'captain', 'lieutenant', 'colonel', 'general', 'king', 'queen', 'lady', 'lord', 'variant', 'of', 'and'])

interface CastCredit {
  actorId: number
  actor: string
  gender: number
  profilePath: string | null
  character: string
}

export interface GeneratedCharacter {
  id: string
  name: string
  actor: string
  gender: 'm' | 'f' | null
  profilePath: string | null
  appearances: string[]
}

// tsx doesn't auto-load .env.local the way `next dev` does — load it by hand,
// without overwriting anything already set in the real environment.
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Strips "(voice)", "(uncredited)" and similar parentheticals, drops junk alternate roles
// ("Kraglin / On-Set Rocket" -> "Kraglin"), and normalises whitespace.
function cleanCharacter(raw: string): string {
  const cleaned = raw
    .replace(/\([^)]*\)/g, '')
    .split('/')
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part && !JUNK_PATTERNS.some((p) => p.test(part)))
    .join(' / ')
  return NAME_OVERRIDES[cleaned] ?? cleaned
}

function tokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .split(/[^a-z0-9'-]+/)
      .filter((t) => t.length >= 3 && !STOP_TOKENS.has(t))
  )
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// "What If...? Season 2" -> 2; titles without a season number are treated as season 1.
function seasonNumber(item: WatchItem): number {
  const match = item.title.match(/Season\s+(\d+)$/i)
  return match ? Number(match[1]) : 1
}

async function tmdbGet<T>(endpoint: string, apiKey: string): Promise<T | null> {
  const url = new URL(`${TMDB_API_BASE}/${endpoint}`)
  url.searchParams.set('api_key', apiKey)
  const response = await fetch(url.toString())
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`TMDB ${endpoint} failed: ${response.status}`)
  return (await response.json()) as T
}

async function fetchCredits(item: WatchItem, tmdbId: number, apiKey: string): Promise<CastCredit[]> {
  if (item.mediaType === 'movie') {
    type MovieCast = { id: number; name: string; gender: number; profile_path: string | null; character: string; order: number }
    const data = await tmdbGet<{ cast: MovieCast[] }>(`movie/${tmdbId}/credits`, apiKey)
    return (data?.cast ?? [])
      .filter((c) => c.order < MOVIE_CAST_LIMIT)
      .map((c) => ({ actorId: c.id, actor: c.name, gender: c.gender, profilePath: c.profile_path, character: c.character }))
  }

  // Per-season credits, so a character introduced in a later season doesn't unlock with season 1.
  type TvCast = {
    id: number
    name: string
    gender: number
    profile_path: string | null
    roles: { character: string; episode_count: number }[]
  }
  const data = await tmdbGet<{ cast: TvCast[] }>(`tv/${tmdbId}/season/${seasonNumber(item)}/aggregate_credits`, apiKey)
  return (data?.cast ?? []).slice(0, SEASON_CAST_LIMIT).map((c) => {
    const mainRole = [...c.roles].sort((a, b) => b.episode_count - a.episode_count)[0]
    return { actorId: c.id, actor: c.name, gender: c.gender, profilePath: c.profile_path, character: mainRole?.character ?? '' }
  })
}

async function main() {
  loadEnvLocal()

  const apiKey = getTmdbApiKey()
  if (!apiKey) {
    console.error('TMDB_API_KEY is not set in .env.local — get a free key at https://www.themoviedb.org/settings/api')
    process.exit(1)
  }

  const prisma = new PrismaClient()
  const cached = await prisma.posterCache.findMany()
  await prisma.$disconnect()
  const tmdbIds = new Map(cached.map((c) => [c.itemId, c.tmdbId]))

  // One cluster per (actor, character): all the differently-spelled credits of
  // the same role, plus every watchlist item it appears in.
  interface Cluster {
    actorId: number
    actor: string
    gender: number
    profilePath: string | null
    names: Map<string, number>
    tokens: Set<string>
    appearances: string[]
  }
  const clustersByActor = new Map<number, Cluster[]>()

  for (const item of ITEMS) {
    if (item.tag === 'one-shot') continue
    const tmdbId = tmdbIds.get(item.id)
    if (!tmdbId) {
      console.log(`- ${item.title}: no cached TMDB id, skipped (run posters:fetch first)`)
      continue
    }

    let credits: CastCredit[]
    try {
      credits = await fetchCredits(item, tmdbId, apiKey)
    } catch (err) {
      console.error(`✗ ${item.title}:`, err instanceof Error ? err.message : err)
      continue
    }

    let kept = 0
    for (const credit of credits) {
      // Whole-string check first: cleanCharacter strips parentheticals like "(uncredited)".
      if (!credit.character || JUNK_PATTERNS.some((p) => p.test(credit.character))) continue
      const name = cleanCharacter(credit.character)
      const nameTokens = tokens(name)
      if (!name || nameTokens.size === 0) continue

      const clusters = clustersByActor.get(credit.actorId) ?? []
      let cluster = clusters.find((c) => [...nameTokens].some((t) => c.tokens.has(t)))
      if (!cluster) {
        cluster = {
          actorId: credit.actorId,
          actor: credit.actor,
          gender: credit.gender,
          profilePath: credit.profilePath,
          names: new Map(),
          tokens: new Set(),
          appearances: [],
        }
        clusters.push(cluster)
        clustersByActor.set(credit.actorId, clusters)
      }
      cluster.names.set(name, (cluster.names.get(name) ?? 0) + 1)
      for (const t of nameTokens) cluster.tokens.add(t)
      if (!cluster.appearances.includes(item.id)) cluster.appearances.push(item.id)
      kept++
    }
    console.log(`✓ ${item.title}: ${kept} characters`)
    await sleep(150)
  }

  const characters: GeneratedCharacter[] = []
  for (const clusters of clustersByActor.values()) {
    for (const c of clusters) {
      // Most-used spelling wins; ties go to the "Real Name / Hero Name" form, then the longer one.
      const mostUsed = [...c.names.entries()].sort(
        (a, b) => b[1] - a[1] || Number(b[0].includes('/')) - Number(a[0].includes('/')) || b[0].length - a[0].length
      )[0][0]
      const name = MERGED_NAME_OVERRIDES[`${c.actor}|${mostUsed}`] ?? mostUsed
      characters.push({
        id: `${c.actorId}-${slug(name)}`,
        name,
        actor: c.actor,
        gender: c.gender === 1 ? 'f' : c.gender === 2 ? 'm' : null,
        profilePath: c.profilePath,
        appearances: c.appearances,
      })
    }
  }
  // Characters in the most titles first, so the pickers lead with the main cast.
  characters.sort((a, b) => b.appearances.length - a.appearances.length || a.name.localeCompare(b.name))

  const outPath = path.resolve(process.cwd(), 'lib/marvel-characters.ts')
  const body = characters.map((c) => `  ${JSON.stringify(c)},`).join('\n')
  fs.writeFileSync(
    outPath,
    `// lib/marvel-characters.ts
//
// GENERATED by scripts/fetch-characters.ts — do not edit by hand, fix the
// script's override tables and re-run \`npm run characters:fetch\` instead.

export interface MarvelCharacter {
  id: string;
  name: string;
  actor: string;
  /** the actor's gender per TMDB; null when TMDB doesn't say */
  gender: "m" | "f" | null;
  /** TMDB profile_path of the actor's photo */
  profilePath: string | null;
  /** watchlist item ids this character is credited in */
  appearances: string[];
}

export const CHARACTERS: MarvelCharacter[] = [
${body}
];
`
  )

  const male = characters.filter((c) => c.gender === 'm').length
  const female = characters.filter((c) => c.gender === 'f').length
  console.log(`\nDone. ${characters.length} characters (m=${male} f=${female} unknown=${characters.length - male - female}) -> lib/marvel-characters.ts`)
}

main()
