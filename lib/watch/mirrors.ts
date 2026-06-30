import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import type { MirrorSource, WatchEpisodeSourceRow, WatchLang, WatchMediaRow } from './types'

const LANG_PRIORITY: WatchLang[] = ['lat', 'sub', 'dub']

function mapRow(row: WatchEpisodeSourceRow): MirrorSource {
  return {
    id: row.id,
    serverLabel: row.server_label,
    sourceType: row.source_type,
    url: row.url,
    referer: row.referer,
    quality: row.quality,
    lang: row.lang,
    tier: 'mirror',
  }
}

async function findMedia(
  malId?: number | null,
  anilistId?: number | null,
): Promise<{ media: WatchMediaRow | null; resolvedBy: 'mal' | 'anilist' | null }> {
  if (!isSupabaseConfigured()) return { media: null, resolvedBy: null }
  const admin = getSupabaseAdmin()

  if (malId) {
    const { data } = await admin
      .from('watch_media')
      .select('id, mal_id, anilist_id, title, slug, notes, is_active')
      .eq('mal_id', malId)
      .eq('is_active', true)
      .maybeSingle()
    if (data) return { media: data as WatchMediaRow, resolvedBy: 'mal' }
  }

  if (anilistId) {
    const { data } = await admin
      .from('watch_media')
      .select('id, mal_id, anilist_id, title, slug, notes, is_active')
      .eq('anilist_id', anilistId)
      .eq('is_active', true)
      .maybeSingle()
    if (data) return { media: data as WatchMediaRow, resolvedBy: 'anilist' }
  }

  return { media: null, resolvedBy: null }
}

export async function getEpisodeMirrors(opts: {
  malId?: number | null
  anilistId?: number | null
  episode: number
  lang?: WatchLang
}): Promise<{
  mirrors: MirrorSource[]
  media: WatchMediaRow | null
  resolvedBy: 'mal' | 'anilist' | null
  langsAvailable: WatchLang[]
}> {
  const { media, resolvedBy } = await findMedia(opts.malId, opts.anilistId)
  if (!media) {
    return { mirrors: [], media: null, resolvedBy: null, langsAvailable: [] }
  }

  const admin = getSupabaseAdmin()
  let query = admin
    .from('watch_episode_sources')
    .select(
      'id, media_id, episode, lang, source_type, server_label, url, referer, quality, sort_order, is_active',
    )
    .eq('media_id', media.id)
    .eq('episode', opts.episode)
    .eq('is_active', true)
    .order('sort_order')
    .order('id')

  if (opts.lang) query = query.eq('lang', opts.lang)

  const { data } = await query
  const rows = (data || []) as WatchEpisodeSourceRow[]

  const { data: langRows } = await admin
    .from('watch_episode_sources')
    .select('lang')
    .eq('media_id', media.id)
    .eq('episode', opts.episode)
    .eq('is_active', true)

  const langsAvailable = [...new Set((langRows || []).map((r) => r.lang as WatchLang))].sort(
    (a, b) => LANG_PRIORITY.indexOf(a) - LANG_PRIORITY.indexOf(b),
  )

  return {
    mirrors: rows.map(mapRow),
    media,
    resolvedBy,
    langsAvailable,
  }
}

export async function listWatchMedia(): Promise<WatchMediaRow[]> {
  if (!isSupabaseConfigured()) return []
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('watch_media')
    .select('id, mal_id, anilist_id, title, slug, notes, is_active')
    .order('updated_at', { ascending: false })
    .limit(200)
  return (data || []) as WatchMediaRow[]
}

export async function listEpisodeSourcesForAdmin(
  mediaId: number,
  episode: number,
): Promise<WatchEpisodeSourceRow[]> {
  if (!isSupabaseConfigured()) return []
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('watch_episode_sources')
    .select(
      'id, media_id, episode, lang, source_type, server_label, url, referer, quality, sort_order, is_active',
    )
    .eq('media_id', mediaId)
    .eq('episode', episode)
    .order('lang')
    .order('sort_order')
  return (data || []) as WatchEpisodeSourceRow[]
}

export async function upsertWatchMedia(input: {
  id?: number
  mal_id?: number | null
  anilist_id?: number | null
  title: string
  slug?: string | null
  notes?: string | null
}): Promise<{ media: WatchMediaRow | null; error?: string }> {
  if (!isSupabaseConfigured()) return { media: null, error: 'Supabase no configurado' }
  if (!input.mal_id && !input.anilist_id) {
    return { media: null, error: 'Indica mal_id o anilist_id' }
  }

  const admin = getSupabaseAdmin()
  const base = {
    mal_id: input.mal_id ?? null,
    anilist_id: input.anilist_id ?? null,
    title: input.title.trim(),
    slug: input.slug?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { data, error } = await admin
      .from('watch_media')
      .update(base)
      .eq('id', input.id)
      .select('id, mal_id, anilist_id, title, slug, notes, is_active')
      .maybeSingle()
    if (error) return { media: null, error: error.message }
    return { media: data as WatchMediaRow }
  }

  const lookup = input.mal_id
    ? await admin.from('watch_media').select('id').eq('mal_id', input.mal_id).maybeSingle()
    : input.anilist_id
      ? await admin.from('watch_media').select('id').eq('anilist_id', input.anilist_id).maybeSingle()
      : { data: null, error: null }

  if (lookup.error) return { media: null, error: lookup.error.message }

  if (lookup.data?.id) {
    const { data, error } = await admin
      .from('watch_media')
      .update(base)
      .eq('id', lookup.data.id)
      .select('id, mal_id, anilist_id, title, slug, notes, is_active')
      .maybeSingle()
    if (error) return { media: null, error: error.message }
    return { media: data as WatchMediaRow }
  }

  const { data, error } = await admin
    .from('watch_media')
    .insert(base)
    .select('id, mal_id, anilist_id, title, slug, notes, is_active')
    .maybeSingle()

  if (error) return { media: null, error: error.message }
  return { media: data as WatchMediaRow }
}

export async function upsertEpisodeSource(input: {
  id?: number
  media_id: number
  episode: number
  lang: WatchLang
  source_type: WatchEpisodeSourceRow['source_type']
  server_label: string
  url: string
  referer?: string | null
  quality?: string | null
  sort_order?: number
}): Promise<{ source: WatchEpisodeSourceRow | null; error?: string }> {
  if (!isSupabaseConfigured()) return { source: null, error: 'Supabase no configurado' }
  const admin = getSupabaseAdmin()
  const payload = {
    media_id: input.media_id,
    episode: input.episode,
    lang: input.lang,
    source_type: input.source_type,
    server_label: input.server_label.trim(),
    url: input.url.trim(),
    referer: input.referer?.trim() || null,
    quality: input.quality?.trim() || null,
    sort_order: input.sort_order ?? 0,
    is_active: true,
  }

  if (input.id) {
    const { data, error } = await admin
      .from('watch_episode_sources')
      .update(payload)
      .eq('id', input.id)
      .select(
        'id, media_id, episode, lang, source_type, server_label, url, referer, quality, sort_order, is_active',
      )
      .maybeSingle()
    if (error) return { source: null, error: error.message }
    return { source: data as WatchEpisodeSourceRow }
  }

  const { data, error } = await admin
    .from('watch_episode_sources')
    .insert(payload)
    .select(
      'id, media_id, episode, lang, source_type, server_label, url, referer, quality, sort_order, is_active',
    )
    .maybeSingle()

  if (error) return { source: null, error: error.message }
  return { source: data as WatchEpisodeSourceRow }
}

export async function deleteEpisodeSource(id: number): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: 'Supabase no configurado' }
  const admin = getSupabaseAdmin()
  const { error } = await admin.from('watch_episode_sources').delete().eq('id', id)
  return error ? { error: error.message } : {}
}
