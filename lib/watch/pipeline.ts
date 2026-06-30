import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import type { WatchLang, WatchMediaRow, WatchSourceType } from './types'

export type WatchCatalogGap = WatchMediaRow & {
  priority: number
  catalog_source: string | null
  episodes_total: number | null
  lat_sources_count: number
}

export type WatchSubmission = {
  id: number
  mal_id: number
  episode: number
  lang: WatchLang
  source_type: WatchSourceType
  server_label: string
  url: string
  referer: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_by: string | null
  created_at: string
  submitter_name?: string | null
}

export async function listCatalogGaps(limit = 40): Promise<WatchCatalogGap[]> {
  if (!isSupabaseConfigured()) return []
  const admin = getSupabaseAdmin()

  const { data: media } = await admin
    .from('watch_media')
    .select('id, mal_id, anilist_id, title, slug, notes, is_active, priority, catalog_source, episodes_total')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(150)

  if (!media?.length) return []

  const ids = media.map((m) => m.id)
  const { data: latSources } = await admin
    .from('watch_episode_sources')
    .select('media_id')
    .in('media_id', ids)
    .eq('lang', 'lat')
    .eq('is_active', true)

  const counts = new Map<number, number>()
  for (const row of latSources || []) {
    counts.set(row.media_id, (counts.get(row.media_id) || 0) + 1)
  }

  return media
    .map((m) => ({
      ...(m as WatchMediaRow),
      priority: m.priority ?? 0,
      catalog_source: m.catalog_source ?? null,
      episodes_total: m.episodes_total ?? null,
      lat_sources_count: counts.get(m.id) || 0,
    }))
    .filter((m) => m.lat_sources_count === 0)
    .slice(0, limit)
}

export async function listPendingSubmissions(limit = 50): Promise<WatchSubmission[]> {
  if (!isSupabaseConfigured()) return []
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('watch_source_submissions')
    .select(
      'id, mal_id, episode, lang, source_type, server_label, url, referer, notes, status, submitted_by, created_at',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit)

  const rows = data || []
  const userIds = [...new Set(rows.map((r) => r.submitted_by).filter(Boolean))] as string[]
  const names = new Map<string, string>()

  if (userIds.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, display_name, username')
      .in('id', userIds)
    for (const p of profiles || []) {
      names.set(p.id, p.display_name || p.username || 'Usuario')
    }
  }

  return rows.map((r) => ({
    ...(r as WatchSubmission),
    submitter_name: r.submitted_by ? names.get(r.submitted_by) || null : null,
  }))
}

export async function createSubmission(input: {
  mal_id: number
  episode: number
  lang?: WatchLang
  source_type?: WatchSourceType
  server_label?: string
  url: string
  referer?: string | null
  notes?: string | null
  submitted_by?: string | null
}): Promise<{ submission: WatchSubmission | null; error?: string }> {
  if (!isSupabaseConfigured()) return { submission: null, error: 'Supabase no configurado' }
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('watch_source_submissions')
    .insert({
      mal_id: input.mal_id,
      episode: Math.max(1, input.episode),
      lang: input.lang || 'lat',
      source_type: input.source_type || 'iframe',
      server_label: input.server_label?.trim() || 'Aporte',
      url: input.url.trim(),
      referer: input.referer?.trim() || null,
      notes: input.notes?.trim() || null,
      submitted_by: input.submitted_by || null,
      status: 'pending',
    })
    .select(
      'id, mal_id, episode, lang, source_type, server_label, url, referer, notes, status, submitted_by, created_at',
    )
    .maybeSingle()

  if (error) return { submission: null, error: error.message }
  return { submission: data as WatchSubmission }
}

export async function reviewSubmission(
  id: number,
  action: 'approve' | 'reject',
  reviewerId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Supabase no configurado' }
  const admin = getSupabaseAdmin()

  const { data: sub } = await admin
    .from('watch_source_submissions')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!sub) return { ok: false, error: 'Aporte no encontrado o ya revisado' }

  if (action === 'reject') {
    const { error } = await admin
      .from('watch_source_submissions')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
    return error ? { ok: false, error: error.message } : { ok: true }
  }

  const { upsertWatchMedia, upsertEpisodeSource } = await import('./mirrors')
  const { resolveAnilistId } = await import('./resolve-ids')
  const { fetchJikan } = await import('../jikan')

  const jikan = await fetchJikan(`/anime/${sub.mal_id}`, 86400)
  const title = jikan?.data?.title || `Anime ${sub.mal_id}`
  const anilist_id = await resolveAnilistId(sub.mal_id)

  const mediaRes = await upsertWatchMedia({
    mal_id: sub.mal_id,
    anilist_id,
    title,
    notes: 'catalog:submission',
  })
  if (mediaRes.error || !mediaRes.media) {
    return { ok: false, error: mediaRes.error || 'No se registró el anime' }
  }

  await admin
    .from('watch_media')
    .update({ catalog_source: 'submission', priority: 90 })
    .eq('id', mediaRes.media.id)

  const sourceRes = await upsertEpisodeSource({
    media_id: mediaRes.media.id,
    episode: sub.episode,
    lang: sub.lang as WatchLang,
    source_type: sub.source_type as WatchSourceType,
    server_label: sub.server_label,
    url: sub.url,
    referer: sub.referer,
  })
  if (sourceRes.error) return { ok: false, error: sourceRes.error }

  const { error } = await admin
    .from('watch_source_submissions')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  return error ? { ok: false, error: error.message } : { ok: true }
}
