/** Idiomas soportados en /ver. `lat` solo vía espejos propios en Supabase. */
export type WatchLang = 'lat' | 'sub' | 'dub'

export type WatchSourceType = 'hls' | 'mp4' | 'iframe'

export type MirrorSource = {
  id: number
  serverLabel: string
  sourceType: WatchSourceType
  url: string
  referer?: string | null
  quality?: string | null
  lang: WatchLang
  tier: 'mirror'
}

export type EmbedPlaybackSource = {
  id: string
  serverLabel: string
  sourceType: 'iframe'
  url: string
  lang: WatchLang
  tier: 'embed'
  idKind: 'mal' | 'anilist'
}

export type PlaybackSource = MirrorSource | EmbedPlaybackSource

export type WatchMediaRow = {
  id: number
  mal_id: number | null
  anilist_id: number | null
  title: string
  slug: string | null
  notes: string | null
  is_active: boolean
}

export type WatchEpisodeSourceRow = {
  id: number
  media_id: number
  episode: number
  lang: WatchLang
  source_type: WatchSourceType
  server_label: string
  url: string
  referer: string | null
  quality: string | null
  sort_order: number
  is_active: boolean
}
