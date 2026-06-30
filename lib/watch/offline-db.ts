import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import { upsertWatchMedia } from './mirrors'
import { logIngestRun } from './catalog-seed'

export type OfflineAnimeRaw = {
  sources?: string[]
  title?: string
  type?: string
  episodes?: number
  status?: string
  score?: { arithmeticGeometricMean?: number }
}

export type OfflineCatalogCandidate = {
  mal_id: number | null
  anilist_id: number | null
  kitsu_id: number | null
  title: string
  episodes_total: number | null
  anime_type: string | null
  anime_status: string | null
  score: number | null
}

export type OfflineFilterOptions = {
  types?: string[]
  statuses?: string[]
  minEpisodes?: number
  minScore?: number
  limit?: number
  requireMal?: boolean
}

export type OfflineSeedResult = {
  candidates: number
  synced: number
  skipped: number
  errors: string[]
}

const ID_PATTERNS: { key: 'mal_id' | 'anilist_id' | 'kitsu_id'; re: RegExp }[] = [
  { key: 'mal_id', re: /myanimelist\.net\/anime\/(\d+)/i },
  { key: 'anilist_id', re: /anilist\.co\/anime\/(\d+)/i },
  { key: 'kitsu_id', re: /kitsu\.(?:app|io)\/anime\/(\d+)/i },
]

export function parseIdsFromSources(sources: string[] | undefined): {
  mal_id: number | null
  anilist_id: number | null
  kitsu_id: number | null
} {
  const out = { mal_id: null as number | null, anilist_id: null as number | null, kitsu_id: null as number | null }
  if (!sources?.length) return out

  for (const url of sources) {
    for (const { key, re } of ID_PATTERNS) {
      if (out[key] != null) continue
      const match = url.match(re)
      if (match) out[key] = Number(match[1])
    }
  }
  return out
}

export function mapOfflineAnimeToCandidate(anime: OfflineAnimeRaw): OfflineCatalogCandidate | null {
  const title = anime.title?.trim()
  if (!title) return null

  const ids = parseIdsFromSources(anime.sources)
  if (!ids.mal_id && !ids.anilist_id) return null

  const episodes =
    typeof anime.episodes === 'number' && anime.episodes > 0 ? anime.episodes : null

  return {
    mal_id: ids.mal_id,
    anilist_id: ids.anilist_id,
    kitsu_id: ids.kitsu_id,
    title,
    episodes_total: episodes,
    anime_type: anime.type?.toUpperCase() || null,
    anime_status: anime.status?.toUpperCase() || null,
    score:
      typeof anime.score?.arithmeticGeometricMean === 'number'
        ? anime.score.arithmeticGeometricMean
        : null,
  }
}

export function mapOfflineDatabaseEntries(raw: unknown): OfflineCatalogCandidate[] {
  const items = extractAnimeArray(raw)
  const out: OfflineCatalogCandidate[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const candidate = mapOfflineAnimeToCandidate(item as OfflineAnimeRaw)
    if (!candidate) continue
    const key = candidate.mal_id ? `mal:${candidate.mal_id}` : `ani:${candidate.anilist_id}`
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(candidate)
  }
  return out
}

function extractAnimeArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    const obj = raw as { data?: unknown[] }
    if (Array.isArray(obj.data)) return obj.data
  }
  return []
}

export function filterOfflineCandidates(
  candidates: OfflineCatalogCandidate[],
  opts: OfflineFilterOptions = {},
): OfflineCatalogCandidate[] {
  const requireMal = opts.requireMal !== false
  const types = opts.types?.map((t) => t.toUpperCase())
  const statuses = opts.statuses?.map((s) => s.toUpperCase())

  let filtered = candidates.filter((c) => {
    if (requireMal && !c.mal_id) return false
    if (types?.length && c.anime_type && !types.includes(c.anime_type)) return false
    if (statuses?.length && c.anime_status && !statuses.includes(c.anime_status)) return false
    if (opts.minEpisodes != null) {
      if (!c.episodes_total || c.episodes_total < opts.minEpisodes) return false
    }
    if (opts.minScore != null) {
      if (c.score == null || c.score < opts.minScore) return false
    }
    return true
  })

  filtered.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  if (opts.limit != null && opts.limit > 0) {
    filtered = filtered.slice(0, opts.limit)
  }

  return filtered
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function seedOfflineCatalog(
  candidates: OfflineCatalogCandidate[],
  opts: { priority?: number; batchPauseEvery?: number; batchPauseMs?: number } = {},
): Promise<OfflineSeedResult> {
  const priority = opts.priority ?? 10
  const pauseEvery = opts.batchPauseEvery ?? 50
  const pauseMs = opts.batchPauseMs ?? 200

  const result: OfflineSeedResult = {
    candidates: candidates.length,
    synced: 0,
    skipped: 0,
    errors: [],
  }

  if (!isSupabaseConfigured()) {
    result.errors.push('Supabase no configurado')
    return result
  }

  const admin = getSupabaseAdmin()

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const label = c.mal_id ? `MAL ${c.mal_id}` : `AniList ${c.anilist_id}`

    if (!c.mal_id && !c.anilist_id) {
      result.skipped += 1
      continue
    }

    const upserted = await upsertWatchMedia({
      mal_id: c.mal_id,
      anilist_id: c.anilist_id,
      title: c.title,
    })

    if (upserted.error || !upserted.media) {
      result.errors.push(`${label}: ${upserted.error || 'no registrado'}`)
      continue
    }

    const { error } = await admin
      .from('watch_media')
      .update({
        catalog_source: 'import',
        priority,
        episodes_total: c.episodes_total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', upserted.media.id)

    if (error) {
      result.errors.push(`${label}: ${error.message}`)
      continue
    }

    result.synced += 1
    if (pauseEvery > 0 && i > 0 && i % pauseEvery === 0) await sleep(pauseMs)
  }

  await logIngestRun('seed-offline-db', {
    shows_registered: result.synced,
    sources_added: 0,
    sources_skipped: result.skipped,
    errors: result.errors,
  })

  return result
}
