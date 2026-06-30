/**
 * Backend de streaming para la sección "Ver anime" (/ver).
 *
 * Soporta dos backends self-hosted, en este orden de prioridad:
 *
 *   1. aniwatch-api (https://github.com/ghoshRitesh12/aniwatch-api) — RECOMENDADO.
 *      Activo y mantenido en 2026; devuelve HLS (.m3u8) reales de HiAnime con
 *      sub/dub. Se activa definiendo `ANIWATCH_API_URL`.
 *
 *   2. Consumet (https://github.com/consumet/api.consumet.org) — LEGACY.
 *      Las imágenes públicas suelen tener los scrapers rotos. Se usa solo si
 *      `CONSUMET_API_URL` está definido y `ANIWATCH_API_URL` no.
 *
 * Si ninguno está configurado, estas funciones devuelven null y la UI cae a los
 * embeds por iframe.
 *
 * No se almacena video: solo se consultan metadatos y URLs de streaming que se
 * reproducen en el cliente (proxeando el m3u8 para respetar los headers del CDN).
 */

export type ConsumetEpisode = {
  id: string
  number: number
  title?: string
}

export type ConsumetSource = {
  url: string
  quality?: string
  isM3U8?: boolean
}

export type ConsumetSourcesResult = {
  sources: ConsumetSource[]
  headers?: Record<string, string>
}

type Category = 'sub' | 'dub'

function aniwatchBase(): string {
  return (process.env.ANIWATCH_API_URL || '').replace(/\/$/, '')
}

function consumetBase(): string {
  return (process.env.CONSUMET_API_URL || '').replace(/\/$/, '')
}

function backend(): 'aniwatch' | 'consumet' | null {
  if (aniwatchBase()) return 'aniwatch'
  if (consumetBase()) return 'consumet'
  return null
}

export function isConsumetEnabled(): boolean {
  return backend() !== null
}

async function jget(url: string, revalidate = 3600): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * AniList helpers (mapeo MAL → título / id) — compartido por ambos backends
 * ────────────────────────────────────────────────────────────────────────── */

type AniListMeta = { anilistId: number | null; titles: string[] }

/** MAL id → id de AniList (compat: algunos llamadores externos lo usan). */
export async function malToAnilistId(malId: number | string): Promise<number | null> {
  return (await getAniListMeta(malId)).anilistId
}

/** MAL id → metadatos de AniList: id + lista de títulos candidatos (en/romaji/synonyms). */
async function getAniListMeta(malId: number | string): Promise<AniListMeta> {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query:
          'query($idMal:Int){Media(idMal:$idMal,type:ANIME){id title{romaji english native} synonyms}}',
        variables: { idMal: Number(malId) },
      }),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return { anilistId: null, titles: [] }
    const data = await res.json()
    const media = data?.data?.Media
    if (!media) return { anilistId: null, titles: [] }
    const titles = [
      media.title?.english,
      media.title?.romaji,
      ...(Array.isArray(media.synonyms) ? media.synonyms : []),
    ].filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
    return { anilistId: media.id ?? null, titles }
  } catch {
    return { anilistId: null, titles: [] }
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Backend: aniwatch-api (HiAnime)
 * ────────────────────────────────────────────────────────────────────────── */

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Cache en memoria (por instancia) del mapeo MAL → animeId de HiAnime.
const hianimeIdCache = new Map<string, string | null>()

/** Busca el animeId de HiAnime que mejor coincide con los títulos dados. */
async function resolveHianimeId(malId: number | string): Promise<string | null> {
  const key = String(malId)
  if (hianimeIdCache.has(key)) return hianimeIdCache.get(key) ?? null

  const { titles } = await getAniListMeta(malId)
  if (!titles.length) {
    hianimeIdCache.set(key, null)
    return null
  }

  const wanted = titles.map(normalizeTitle)
  let firstResultId: string | null = null

  for (const title of titles) {
    const data = await jget(
      `${aniwatchBase()}/api/v2/hianime/search?q=${encodeURIComponent(title)}&page=1`,
      86400,
    )
    const animes = data?.data?.animes
    if (!Array.isArray(animes) || !animes.length) continue
    if (!firstResultId && animes[0]?.id) firstResultId = String(animes[0].id)

    // Coincidencia exacta normalizada por nombre o jname.
    for (const a of animes) {
      const cand = [a?.name, a?.jname].filter(Boolean).map((x: string) => normalizeTitle(x))
      if (cand.some((c) => wanted.includes(c))) {
        const id = String(a.id)
        hianimeIdCache.set(key, id)
        return id
      }
    }
  }

  // Sin match exacto: usar el primer resultado del primer título (mejor que nada).
  hianimeIdCache.set(key, firstResultId)
  return firstResultId
}

async function aniwatchEpisodes(malId: number | string): Promise<ConsumetEpisode[] | null> {
  const animeId = await resolveHianimeId(malId)
  if (!animeId) return null

  const data = await jget(
    `${aniwatchBase()}/api/v2/hianime/anime/${encodeURIComponent(animeId)}/episodes`,
    3600,
  )
  const episodes = data?.data?.episodes
  if (!Array.isArray(episodes)) return null

  return episodes
    .map((e: any) => ({
      id: String(e.episodeId),
      number: Number(e.number),
      title: e.title,
    }))
    .filter((e: ConsumetEpisode) => e.id && Number.isFinite(e.number))
    .sort((a: ConsumetEpisode, b: ConsumetEpisode) => a.number - b.number)
}

// Servidores de HiAnime a intentar, en orden, si el primero no da fuentes.
const HIANIME_SERVERS = ['hd-1', 'hd-2', 'vidstreaming', 'vidcloud', 'megacloud']

async function aniwatchSources(
  episodeId: string,
  category: Category,
): Promise<ConsumetSourcesResult | null> {
  const epParam = encodeURIComponent(episodeId)
  for (const server of HIANIME_SERVERS) {
    const data = await jget(
      `${aniwatchBase()}/api/v2/hianime/episode/sources?animeEpisodeId=${epParam}&server=${server}&category=${category}`,
      300,
    )
    const sources = data?.data?.sources
    if (Array.isArray(sources) && sources.length) {
      return {
        sources: sources.map((s: any) => ({
          url: String(s.url),
          quality: s.quality,
          isM3U8: Boolean(s.isM3U8 ?? String(s.url).includes('.m3u8')),
        })),
        headers: data?.data?.headers || undefined,
      }
    }
  }
  return null
}

/* ──────────────────────────────────────────────────────────────────────────
 * Backend: Consumet (legacy)
 * ────────────────────────────────────────────────────────────────────────── */

const CONSUMET_PROVIDER = process.env.CONSUMET_ANIME_PROVIDER || 'zoro'

async function consumetEpisodes(
  malId: number | string,
  opts?: { dub?: boolean; provider?: string },
): Promise<ConsumetEpisode[] | null> {
  const anilistId = await malToAnilistId(malId)
  if (!anilistId) return null

  const provider = opts?.provider || CONSUMET_PROVIDER
  const dub = opts?.dub ? '&dub=true' : ''
  const info = await jget(
    `${consumetBase()}/meta/anilist/info/${anilistId}?provider=${provider}${dub}`,
  )
  const episodes = info?.episodes
  if (!Array.isArray(episodes)) return null

  return episodes
    .map((e: any) => ({ id: String(e.id), number: Number(e.number), title: e.title }))
    .filter((e: ConsumetEpisode) => e.id && Number.isFinite(e.number))
    .sort((a: ConsumetEpisode, b: ConsumetEpisode) => a.number - b.number)
}

async function consumetSources(
  episodeId: string,
  opts?: { provider?: string },
): Promise<ConsumetSourcesResult | null> {
  const provider = opts?.provider || CONSUMET_PROVIDER
  const data = await jget(
    `${consumetBase()}/meta/anilist/watch/${encodeURIComponent(episodeId)}?provider=${provider}`,
  )
  const sources = data?.sources
  if (!Array.isArray(sources) || sources.length === 0) return null

  return {
    sources: sources.map((s: any) => ({
      url: String(s.url),
      quality: s.quality,
      isM3U8: Boolean(s.isM3U8),
    })),
    headers: data?.headers || undefined,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * API pública (mismo contrato para ambos backends)
 * ────────────────────────────────────────────────────────────────────────── */

/** Lista de episodios de un anime (por MAL id). */
export async function getEpisodes(
  malId: number | string,
  opts?: { dub?: boolean; provider?: string },
): Promise<ConsumetEpisode[] | null> {
  const b = backend()
  if (b === 'aniwatch') return aniwatchEpisodes(malId)
  if (b === 'consumet') return consumetEpisodes(malId, opts)
  return null
}

/** Fuentes (m3u8) de un episodio concreto. */
export async function getSources(
  episodeId: string,
  opts?: { provider?: string; category?: Category },
): Promise<ConsumetSourcesResult | null> {
  const b = backend()
  if (b === 'aniwatch') return aniwatchSources(episodeId, opts?.category || 'sub')
  if (b === 'consumet') return consumetSources(episodeId, opts)
  return null
}
