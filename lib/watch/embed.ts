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

export type WatchIdKind = 'mal' | 'anilist' | 'kitsu'

export type WatchProvider = {
  id: string
  name: string
  template: string
  /** Plantilla alternativa si MAL falla. */
  anilistTemplate?: string
  /** Algunos agregadores usan Kitsu (p. ej. vía mapa AniList). */
  kitsuTemplate?: string
  /** Si el proveedor ofrece doblaje inglés. */
  dub?: boolean
  /** Prioridad en la UI (mayor = primero). */
  priority?: number
}

const DEFAULT_PROVIDERS: WatchProvider[] = [
  {
    id: 'megaplay',
    name: 'MegaPlay',
    template: 'https://megaplay.buzz/stream/mal/{malId}/{ep}/{type}',
    anilistTemplate: 'https://megaplay.buzz/stream/ani/{anilistId}/{ep}/{type}',
    dub: true,
    priority: 90,
  },
  {
    id: 'vidnest',
    name: 'VidNest',
    anilistTemplate: 'https://vidnest.fun/anime/{anilistId}/{ep}/{type}',
    template: 'https://vidnest.fun/anime/{anilistId}/{ep}/{type}',
    dub: true,
    priority: 85,
  },
  {
    id: 'vidlink',
    name: 'Vidlink',
    template: 'https://vidlink.pro/anime/{malId}/{ep}/{type}?fallback=true',
    dub: true,
    priority: 80,
  },
  {
    id: 'ninja',
    name: 'NinjaStream',
    template: 'https://ninjasheild.stream/map/animemal/{malId}/{ep}/{type}',
    dub: true,
    priority: 70,
  },
  {
    id: 'animeplay',
    name: 'AnimePlay',
    template: 'https://animeplay.cfd/stream/mal/{malId}/{ep}/{type}',
    dub: true,
    priority: 60,
  },
]

const LANG_PREF_KEY = 'animedula-watch-lang'

export function langToEmbedType(lang: WatchLang): 'sub' | 'dub' {
  return lang === 'dub' ? 'dub' : 'sub'
}

export function getDefaultWatchLang(): WatchLang {
  if (typeof window === 'undefined') return 'sub'
  try {
    const saved = localStorage.getItem(LANG_PREF_KEY)
    if (saved === 'lat' || saved === 'sub' || saved === 'dub') return saved
    return 'sub'
  } catch {
    return 'sub'
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
  let list: WatchProvider[]
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) list = parsed as WatchProvider[]
      else list = DEFAULT_PROVIDERS
    } catch {
      list = DEFAULT_PROVIDERS
    }
  } else {
    const single = process.env.NEXT_PUBLIC_ANIME_EMBED_TEMPLATE
    if (single) {
      list = [{ id: 'custom', name: 'Servidor 1', template: single, dub: true }, ...DEFAULT_PROVIDERS]
    } else {
      list = DEFAULT_PROVIDERS
    }
  }
  return [...list].sort((a, b) => (b.priority ?? 50) - (a.priority ?? 50))
}

function pickTemplate(provider: WatchProvider, idKind: WatchIdKind): string | null {
  if (idKind === 'kitsu' && provider.kitsuTemplate) return provider.kitsuTemplate
  if (idKind === 'anilist' && provider.anilistTemplate) return provider.anilistTemplate
  if (idKind === 'mal' && provider.template.includes('{malId}')) return provider.template
  if (idKind === 'anilist' && provider.template.includes('{anilistId}')) return provider.template
  return provider.template
}

export function buildEmbedUrl(
  provider: WatchProvider,
  id: number | string,
  episode: number,
  lang: 'sub' | 'dub' = 'sub',
  idKind: WatchIdKind = 'mal',
  extraQuery?: Record<string, string>,
): string {
  const type = langToEmbedType(lang)
  const template = pickTemplate(provider, idKind)
  if (!template) return ''

  let url = template
    .replaceAll('{malId}', String(idKind === 'mal' ? id : ''))
    .replaceAll('{anilistId}', String(idKind === 'anilist' ? id : ''))
    .replaceAll('{kitsuId}', String(idKind === 'kitsu' ? id : ''))
    .replaceAll('{ep}', String(episode))
    .replaceAll('{type}', type)

  if (extraQuery && Object.keys(extraQuery).length) {
    try {
      const u = new URL(url)
      for (const [k, v] of Object.entries(extraQuery)) {
        u.searchParams.set(k, v)
      }
      url = u.toString()
    } catch {
      const qs = new URLSearchParams(extraQuery).toString()
      url += (url.includes('?') ? '&' : '?') + qs
    }
  }

  return url
}
