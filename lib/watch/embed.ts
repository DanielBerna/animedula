/**
 * Proveedores de embed para ver anime desde servidores externos (respaldo).
 *
 * Los agregadores internacionales solo aceptan sub|dub en la URL.
 * Doblaje latino requiere espejos propios en Supabase (schema v21).
 *
 * Placeholders: {malId} {anilistId} {ep} {type}
 */

import type { WatchLang } from './types'

export type { WatchLang } from './types'

export type WatchIdKind = 'mal' | 'anilist'

export type WatchProvider = {
  id: string
  name: string
  template: string
  /** Plantilla alternativa si MAL falla (usa {anilistId}). */
  anilistTemplate?: string
  /** Si el proveedor ofrece doblaje inglés. */
  dub?: boolean
}

const DEFAULT_PROVIDERS: WatchProvider[] = [
  {
    id: 'megaplay',
    name: 'MegaPlay',
    template: 'https://megaplay.buzz/stream/mal/{malId}/{ep}/{type}',
    anilistTemplate: 'https://megaplay.buzz/stream/anilist/{anilistId}/{ep}/{type}',
    dub: true,
  },
  {
    id: 'vidlink',
    name: 'Vidlink',
    template: 'https://vidlink.pro/anime/{malId}/{ep}/{type}?fallback=true',
    dub: true,
  },
  {
    id: 'ninja',
    name: 'NinjaStream',
    template: 'https://ninjasheild.stream/map/animemal/{malId}/{ep}/{type}',
    dub: true,
  },
  {
    id: 'animeplay',
    name: 'AnimePlay',
    template: 'https://animeplay.cfd/stream/mal/{malId}/{ep}/{type}',
    dub: true,
  },
]

const LANG_PREF_KEY = 'animedula-watch-lang'

export function langToEmbedType(lang: WatchLang): 'sub' | 'dub' {
  return lang === 'dub' ? 'dub' : 'sub'
}

export function getDefaultWatchLang(): WatchLang {
  if (typeof window === 'undefined') return 'lat'
  try {
    const saved = localStorage.getItem(LANG_PREF_KEY)
    if (saved === 'lat' || saved === 'sub' || saved === 'dub') return saved
    return 'lat'
  } catch {
    return 'lat'
  }
}

export function saveWatchLang(lang: WatchLang) {
  try {
    localStorage.setItem(LANG_PREF_KEY, lang)
  } catch {
    /* ignore */
  }
}

export function getWatchProviders(): WatchProvider[] {
  const raw = process.env.NEXT_PUBLIC_ANIME_EMBED_PROVIDERS
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed as WatchProvider[]
    } catch {
      /* ignore */
    }
  }
  const single = process.env.NEXT_PUBLIC_ANIME_EMBED_TEMPLATE
  if (single) {
    return [{ id: 'custom', name: 'Servidor 1', template: single, dub: true }, ...DEFAULT_PROVIDERS]
  }
  return DEFAULT_PROVIDERS
}

export function buildEmbedUrl(
  provider: WatchProvider,
  id: number | string,
  episode: number,
  lang: 'sub' | 'dub' = 'sub',
  idKind: WatchIdKind = 'mal',
): string {
  const type = langToEmbedType(lang)
  const template =
    idKind === 'anilist' && provider.anilistTemplate ? provider.anilistTemplate : provider.template
  const idToken = idKind === 'anilist' ? '{anilistId}' : '{malId}'

  return template
    .replaceAll(idToken, String(id))
    .replaceAll('{malId}', String(idKind === 'mal' ? id : ''))
    .replaceAll('{anilistId}', String(idKind === 'anilist' ? id : ''))
    .replaceAll('{ep}', String(episode))
    .replaceAll('{type}', type)
}
