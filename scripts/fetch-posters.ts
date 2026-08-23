// scripts/fetch-posters.ts
//
// One-time (or re-run-when-needed) script that resolves TMDB poster art for
// every item in the Marvel watchlist and caches it in the PosterCache table.
// Run with: npm run posters:fetch
// Add --force to re-fetch items that already have a cached poster.

import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { ITEMS } from '../lib/marvel-watchlist-data'
import { searchTmdb, getTmdbApiKey, getPosterById } from '../lib/tmdb'

// A handful of titles collide exactly with an unrelated older show on TMDB
// ("Daredevil" 1961's "The Defenders" outranks "Marvel's The Defenders";
// there's no un-prefixed "Daredevil" entry for the Netflix show at all), so
// search-based matching can't disambiguate them. Known TMDB ids, found by
// hand, bypass search entirely for these.
const TMDB_ID_OVERRIDES: Record<string, number> = {
  'disney-extras-daredevil-s1': 61889, // Marvel's Daredevil
  'disney-extras-daredevil-s2': 61889,
  'disney-extras-daredevil-s3': 61889,
  'disney-extras-defenders-s1': 62285, // Marvel's The Defenders
  'mcu-the-consultant': 76122, // Marvel One-Shot: The Consultant (unqualified "The Consultant" search hits an unrelated 2022 thriller)
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

// TMDB search wants the bare show/movie title — strip decorations our list
// uses for display purposes ("Thunderbolts*", "... Season 2") that aren't
// part of the actual TMDB title.
function cleanTitleForSearch(title: string): string {
  return title
    .replace(/\*+$/, '')
    .replace(/\s+Season\s+\d+$/i, '')
    .trim()
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  loadEnvLocal()

  const apiKey = getTmdbApiKey()
  if (!apiKey) {
    console.error('TMDB_API_KEY is not set in .env.local — get a free key at https://www.themoviedb.org/settings/api')
    process.exit(1)
  }

  const force = process.argv.includes('--force')
  const prisma = new PrismaClient()

  let found = 0
  let missing = 0
  let skipped = 0

  try {
    for (const item of ITEMS) {
      if (!force) {
        const existing = await prisma.posterCache.findUnique({ where: { itemId: item.id } })
        if (existing?.posterPath) {
          skipped++
          continue
        }
      }

      const query = cleanTitleForSearch(item.title)
      try {
        const overrideId = TMDB_ID_OVERRIDES[item.id]
        const result = overrideId
          ? { tmdbId: overrideId, posterPath: await getPosterById(overrideId, item.mediaType, apiKey) }
          : await searchTmdb(query, item.mediaType, apiKey)

        await prisma.posterCache.upsert({
          where: { itemId: item.id },
          create: {
            itemId: item.id,
            tmdbId: result?.tmdbId ?? null,
            mediaType: item.mediaType,
            posterPath: result?.posterPath ?? null,
          },
          update: {
            tmdbId: result?.tmdbId ?? null,
            mediaType: item.mediaType,
            posterPath: result?.posterPath ?? null,
          },
        })

        if (result?.posterPath) {
          found++
          console.log(`✓ ${item.title} -> tmdb#${result.tmdbId}${overrideId ? ' (override)' : ''}`)
        } else {
          missing++
          console.log(`? ${item.title} -> no TMDB match for "${query}" (${item.mediaType})`)
        }
      } catch (err) {
        missing++
        console.error(`✗ ${item.title}:`, err instanceof Error ? err.message : err)
      }

      await sleep(150)
    }
  } finally {
    await prisma.$disconnect()
  }

  console.log(`\nDone. found=${found} missing=${missing} skipped=${skipped} (of ${ITEMS.length} total)`)
}

main()
