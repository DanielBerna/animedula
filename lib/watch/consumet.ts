/**
 * Integración con Consumet (https://github.com/consumet/api.consumet.org) para
 * obtener fuentes de video reales (HLS / .m3u8) de varios proveedores
 * (gogoanime, zoro/hianime, etc.), con opción sub/dub.
 *
 * Requiere una instancia de Consumet definida en `CONSUMET_API_URL`
 * (self-hosted recomendado; las públicas son inestables). Si no está configurada,
 * estas funciones devuelven null y la UI cae a los embeds por iframe.
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

export function isConsumetEnabled(): boolean {
  return Boolean(process.env.CONSUMET_API_URL)
}

function base(): string {
  return (process.env.CONSUMET_API_URL || '').replace(/\/$/, '')
}

const DEFAULT_PROVIDER = process.env.CONSUMET_ANIME_PROVIDER || 'zoro'

async function jget(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** MAL id → AniList id (vía AniList GraphQL público). */
export async function malToAnilistId(malId: number | string): Promise<number | null> {
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query: 'query($idMal:Int){Media(idMal:$idMal,type:ANIME){id}}',
        variables: { idMal: Number(malId) },
      }),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.data?.Media?.id ?? null
  } catch {
    return null
  }
}

/** Lista de episodios de un anime (por MAL id) para un proveedor de Consumet. */
export async function getEpisodes(
  malId: number | string,
  opts?: { dub?: boolean; provider?: string },
): Promise<ConsumetEpisode[] | null> {
  if (!isConsumetEnabled()) return null
  const anilistId = await malToAnilistId(malId)
  if (!anilistId) return null

  const provider = opts?.provider || DEFAULT_PROVIDER
  const dub = opts?.dub ? '&dub=true' : ''
  const info = await jget(`${base()}/meta/anilist/info/${anilistId}?provider=${provider}${dub}`)
  const episodes = info?.episodes
  if (!Array.isArray(episodes)) return null

  return episodes
    .map((e: any) => ({ id: String(e.id), number: Number(e.number), title: e.title }))
    .filter((e: ConsumetEpisode) => e.id && Number.isFinite(e.number))
    .sort((a: ConsumetEpisode, b: ConsumetEpisode) => a.number - b.number)
}

/** Fuentes (m3u8) de un episodio concreto. */
export async function getSources(
  episodeId: string,
  opts?: { provider?: string },
): Promise<ConsumetSourcesResult | null> {
  if (!isConsumetEnabled()) return null
  const provider = opts?.provider || DEFAULT_PROVIDER
  const data = await jget(
    `${base()}/meta/anilist/watch/${encodeURIComponent(episodeId)}?provider=${provider}`,
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
