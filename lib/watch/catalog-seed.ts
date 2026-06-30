import { fetchJikan } from '../jikan'
import { resolveAnilistId } from './resolve-ids'
import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import { upsertWatchMedia } from './mirrors'

export type CatalogSource = 'top' | 'seasonal' | 'schedule'

type CatalogCandidate = {
  mal_id: number
  title: string
  episodes_total?: number | null
  catalog_source: CatalogSource
  priority: number
}

const SCHEDULE_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function mapJikanAnime(
  item: { mal_id?: number; title?: string; episodes?: number },
  catalog_source: CatalogSource,
  priority: number,
): CatalogCandidate | null {
  if (!item.mal_id || !item.title) return null
  return {
    mal_id: item.mal_id,
    title: item.title,
    episodes_total: typeof item.episodes === 'number' ? item.episodes : null,
    catalog_source,
    priority,
  }
}

function dedupeCandidates(items: CatalogCandidate[]): CatalogCandidate[] {
  const map = new Map<number, CatalogCandidate>()
  for (const item of items) {
    const prev = map.get(item.mal_id)
    if (!prev || item.priority > prev.priority) map.set(item.mal_id, item)
  }
  return [...map.values()]
}

async function fetchTop(limit = 30): Promise<CatalogCandidate[]> {
  const data = await fetchJikan(`/top/anime?limit=${limit}`, 3600)
  return (data?.data || [])
    .map((it: { mal_id?: number; title?: string; episodes?: number }) =>
      mapJikanAnime(it, 'top', 100),
    )
    .filter(Boolean) as CatalogCandidate[]
}

async function fetchSeasonal(limit = 30): Promise<CatalogCandidate[]> {
  const data = await fetchJikan(`/seasons/now?limit=${limit}`, 3600)
  return (data?.data || [])
    .map((it: { mal_id?: number; title?: string; episodes?: number }) =>
      mapJikanAnime(it, 'seasonal', 80),
    )
    .filter(Boolean) as CatalogCandidate[]
}

async function fetchSchedules(limitPerDay = 12): Promise<CatalogCandidate[]> {
  const out: CatalogCandidate[] = []
  for (const day of SCHEDULE_DAYS) {
    const data = await fetchJikan(`/schedules?filter=${day}&limit=${limitPerDay}&sfw=true`, 1800)
    const batch = (data?.data || [])
      .map((it: { mal_id?: number; title?: string; episodes?: number }) =>
        mapJikanAnime(it, 'schedule', 60),
      )
      .filter(Boolean) as CatalogCandidate[]
    out.push(...batch)
  }
  return out
}

export type CatalogSeedResult = {
  candidates: number
  synced: number
  errors: string[]
}

async function upsertCatalogEntry(candidate: CatalogCandidate): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const admin = getSupabaseAdmin()

  const { data: existing } = await admin
    .from('watch_media')
    .select('id, anilist_id')
    .eq('mal_id', candidate.mal_id)
    .maybeSingle()

  let anilist_id = existing?.anilist_id ?? null
  if (!anilist_id) {
    anilist_id = await resolveAnilistId(candidate.mal_id)
  }

  const result = await upsertWatchMedia({
    mal_id: candidate.mal_id,
    anilist_id,
    title: candidate.title,
  })

  if (result.error || !result.media) return false

  const { error } = await admin
    .from('watch_media')
    .update({
      catalog_source: candidate.catalog_source,
      priority: candidate.priority,
      episodes_total: candidate.episodes_total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.media.id)

  return !error
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function seedWatchCatalog(): Promise<CatalogSeedResult> {
  const result: CatalogSeedResult = {
    candidates: 0,
    synced: 0,
    errors: [],
  }

  if (!isSupabaseConfigured()) {
    result.errors.push('Supabase no configurado')
    return result
  }

  const [top, seasonal, schedule] = await Promise.all([
    fetchTop(30),
    fetchSeasonal(30),
    fetchSchedules(10),
  ])

  const candidates = dedupeCandidates([...top, ...seasonal, ...schedule])
  result.candidates = candidates.length

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const ok = await upsertCatalogEntry(candidate)
    if (ok) result.synced += 1
    else result.errors.push(`MAL ${candidate.mal_id}: no se registró`)
    if (i % 8 === 7) await sleep(1200)
  }

  await logIngestRun('seed-catalog', {
    shows_registered: result.synced,
    sources_added: 0,
    sources_skipped: 0,
    errors: result.errors,
  })

  return result
}

export async function logIngestRun(
  job: string,
  stats: {
    shows_registered: number
    sources_added: number
    sources_skipped: number
    errors: string[]
  },
) {
  if (!isSupabaseConfigured()) return
  const admin = getSupabaseAdmin()
  await admin.from('watch_ingest_runs').insert({
    job,
    shows_registered: stats.shows_registered,
    sources_added: stats.sources_added,
    sources_skipped: stats.sources_skipped,
    errors: stats.errors.slice(0, 20),
  })
}
