import { fetchJikan } from '../jikan'
import { resolveAnilistId } from './resolve-ids'
import { upsertEpisodeSource, upsertWatchMedia } from './mirrors'
import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import { logIngestRun } from './catalog-seed'
import type { WatchLang, WatchSourceType } from './types'

export type WatchImportSource = {
  lang: WatchLang
  source_type: WatchSourceType
  server_label: string
  url: string
  referer?: string | null
  quality?: string | null
  sort_order?: number
}

export type WatchImportEpisode = {
  episode: number
  sources: WatchImportSource[]
}

export type WatchImportShow = {
  mal_id?: number | null
  anilist_id?: number | null
  title?: string
  episodes: WatchImportEpisode[]
}

export type WatchImportFlatRow = WatchImportSource & {
  mal_id?: number | null
  anilist_id?: number | null
  title?: string
  episode: number
}

export type WatchImportPayload = { shows: WatchImportShow[] } | WatchImportFlatRow[]

export type WatchImportResult = {
  showsRegistered: number
  sourcesAdded: number
  sourcesSkipped: number
  errors: string[]
}

function isValidLang(v: string): v is WatchLang {
  return v === 'lat' || v === 'sub' || v === 'dub'
}

function isValidType(v: string): v is WatchSourceType {
  return v === 'hls' || v === 'mp4' || v === 'iframe'
}

function showKey(malId?: number | null, anilistId?: number | null): string {
  if (malId) return `mal:${malId}`
  if (anilistId) return `ani:${anilistId}`
  return 'unknown'
}

function flattenPayload(payload: WatchImportPayload): WatchImportFlatRow[] {
  if (Array.isArray(payload)) return payload

  const rows: WatchImportFlatRow[] = []
  for (const show of payload.shows || []) {
    for (const ep of show.episodes || []) {
      for (const src of ep.sources || []) {
        rows.push({
          mal_id: show.mal_id,
          anilist_id: show.anilist_id,
          title: show.title,
          episode: ep.episode,
          ...src,
        })
      }
    }
  }
  return rows
}

async function resolveShowMeta(
  malId?: number | null,
  anilistId?: number | null,
  title?: string,
): Promise<{ mal_id: number | null; anilist_id: number | null; title: string; error?: string }> {
  let mal = malId && Number.isFinite(malId) ? malId : null
  let ani = anilistId && Number.isFinite(anilistId) ? anilistId : null
  let name = title?.trim() || ''

  if (mal && !ani) {
    ani = await resolveAnilistId(mal)
  }

  if (mal && !name) {
    const data = await fetchJikan(`/anime/${mal}`, 86400)
    name = data?.data?.title || `Anime ${mal}`
  }

  if (!mal && !ani) {
    return { mal_id: null, anilist_id: null, title: name, error: 'Fila sin mal_id ni anilist_id' }
  }

  if (!name) {
    name = mal ? `Anime ${mal}` : `AniList ${ani}`
  }

  return { mal_id: mal, anilist_id: ani, title: name }
}

async function sourceExists(
  mediaId: number,
  episode: number,
  lang: WatchLang,
  url: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('watch_episode_sources')
    .select('id')
    .eq('media_id', mediaId)
    .eq('episode', episode)
    .eq('lang', lang)
    .eq('url', url)
    .maybeSingle()
  return Boolean(data?.id)
}

export async function importWatchMirrors(payload: WatchImportPayload): Promise<WatchImportResult> {
  const result: WatchImportResult = {
    showsRegistered: 0,
    sourcesAdded: 0,
    sourcesSkipped: 0,
    errors: [],
  }

  if (!isSupabaseConfigured()) {
    result.errors.push('Supabase no configurado')
    return result
  }

  const rows = flattenPayload(payload)
  if (!rows.length) {
    result.errors.push('JSON vacío o sin episodios')
    return result
  }

  const mediaCache = new Map<string, number>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowLabel = `fila ${i + 1}`

    if (!row.url?.trim()) {
      result.errors.push(`${rowLabel}: url vacía`)
      continue
    }
    if (!isValidLang(row.lang)) {
      result.errors.push(`${rowLabel}: lang inválido`)
      continue
    }
    if (!isValidType(row.source_type)) {
      result.errors.push(`${rowLabel}: source_type inválido`)
      continue
    }
    if (!row.server_label?.trim()) {
      result.errors.push(`${rowLabel}: server_label vacío`)
      continue
    }

    const episode = Math.max(1, Number(row.episode) || 1)
    const meta = await resolveShowMeta(row.mal_id, row.anilist_id, row.title)
    if (meta.error) {
      result.errors.push(`${rowLabel}: ${meta.error}`)
      continue
    }

    const key = showKey(meta.mal_id, meta.anilist_id)
    let mediaId = mediaCache.get(key)

    if (!mediaId) {
      const before = await upsertWatchMedia({
        mal_id: meta.mal_id,
        anilist_id: meta.anilist_id,
        title: meta.title,
      })
      if (before.error || !before.media) {
        result.errors.push(`${rowLabel}: ${before.error || 'no se pudo registrar anime'}`)
        continue
      }
      mediaId = before.media.id
      mediaCache.set(key, mediaId)
      result.showsRegistered += 1
    }

    const dup = await sourceExists(mediaId, episode, row.lang, row.url.trim())
    if (dup) {
      result.sourcesSkipped += 1
      continue
    }

    const saved = await upsertEpisodeSource({
      media_id: mediaId,
      episode,
      lang: row.lang,
      source_type: row.source_type,
      server_label: row.server_label,
      url: row.url.trim(),
      referer: row.referer,
      quality: row.quality,
      sort_order: row.sort_order ?? 0,
    })

    if (saved.error || !saved.source) {
      result.errors.push(`${rowLabel}: ${saved.error || 'no se guardó espejo'}`)
      continue
    }

    result.sourcesAdded += 1
  }

  await logIngestRun('import-batch', {
    shows_registered: result.showsRegistered,
    sources_added: result.sourcesAdded,
    sources_skipped: result.sourcesSkipped,
    errors: result.errors,
  })

  return result
}

export async function fetchAndImportWatchFeed(feedUrl: string): Promise<WatchImportResult & { feedUrl: string }> {
  let res: Response
  try {
    res = await fetch(feedUrl, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })
  } catch {
    return {
      feedUrl,
      showsRegistered: 0,
      sourcesAdded: 0,
      sourcesSkipped: 0,
      errors: ['No se pudo descargar el feed'],
    }
  }

  if (!res.ok) {
    return {
      feedUrl,
      showsRegistered: 0,
      sourcesAdded: 0,
      sourcesSkipped: 0,
      errors: [`Feed respondió ${res.status}`],
    }
  }

  let json: WatchImportPayload
  try {
    json = await res.json()
  } catch {
    return {
      feedUrl,
      showsRegistered: 0,
      sourcesAdded: 0,
      sourcesSkipped: 0,
      errors: ['Feed no es JSON válido'],
    }
  }

  const imported = await importWatchMirrors(json)
  return { feedUrl, ...imported }
}
