import { FALLBACK_TOP_ANIME, FALLBACK_TOP_MANGA } from './jikanFallback'

const JIKAN_UA = 'Animedula/1.0 (anime-manga-es; +https://github.com/animedula)'
const MAX_ATTEMPTS = 4

function buildJikanUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `https://api.jikan.moe/v4${normalized}`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetry(status: number) {
  return status === 429 || status === 502 || status === 503 || status === 504
}

export async function fetchJikan(path: string, revalidate = 3600, attempt = 0): Promise<any> {
  const useCache = attempt === 0 && revalidate > 0

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(buildJikanUrl(path), {
      headers: { 'User-Agent': JIKAN_UA, Accept: 'application/json' },
      signal: controller.signal,
      ...(useCache ? { next: { revalidate } } : { cache: 'no-store' as const }),
    })

    clearTimeout(timer)

    if (!res.ok) {
      console.warn(`[jikan] ${res.status} ${path} (attempt ${attempt + 1})`)
      if (shouldRetry(res.status) && attempt < MAX_ATTEMPTS - 1) {
        await sleep(1200 * (attempt + 1))
        return fetchJikan(path, revalidate, attempt + 1)
      }
      return null
    }

    return res.json()
  } catch (err) {
    console.warn(`[jikan] error ${path} (attempt ${attempt + 1})`, err)
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(1200 * (attempt + 1))
      return fetchJikan(path, revalidate, attempt + 1)
    }
    return null
  }
}

export async function fetchTopAnime(limit = 18): Promise<JikanAnime[]> {
  const data = await fetchJikan(`/top/anime?limit=${limit}`)
  const items = mapJikanList(data)
  if (items.length > 0) return items
  console.warn('[jikan] fallback top anime')
  return FALLBACK_TOP_ANIME.slice(0, limit)
}

export async function fetchTopManga(limit = 18): Promise<JikanManga[]> {
  const data = await fetchJikan(`/top/manga?limit=${limit}`)
  const items = mapMangaList(data)
  if (items.length > 0) return items
  console.warn('[jikan] fallback top manga')
  return FALLBACK_TOP_MANGA.slice(0, limit)
}

export type JikanImages = {
  jpg?: { image_url?: string; small_image_url?: string; large_image_url?: string }
  webp?: { image_url?: string; small_image_url?: string; large_image_url?: string }
}

export function getBestImageUrl(images?: JikanImages | null): string | undefined {
  if (!images) return undefined
  return (
    images.webp?.large_image_url ||
    images.jpg?.large_image_url ||
    images.webp?.image_url ||
    images.jpg?.image_url
  )
}

export type JikanStudio = { name?: string }

export type JikanAnime = {
  mal_id: number
  title: string
  synopsis?: string
  score?: number
  images?: JikanImages
  aired?: { from?: string; to?: string }
  status?: string
  season?: string
  year?: number
  episodes?: number | null
  studios?: JikanStudio[]
  type?: string
}

export type JikanManga = {
  mal_id: number
  title: string
  synopsis?: string
  score?: number
  images?: JikanImages
  chapters?: number
  volumes?: number
}

function dedupeByMalId<T extends { mal_id: number }>(items: T[]): T[] {
  const seen = new Set<number>()
  return items.filter((item) => {
    if (!item.mal_id || seen.has(item.mal_id)) return false
    seen.add(item.mal_id)
    return true
  })
}

export function mapJikanList(data: any): JikanAnime[] {
  if (!data?.data) return []
  const items = data.data.map((it: any) => ({
    mal_id: it.mal_id,
    title: it.title,
    synopsis: it.synopsis,
    score: it.score,
    images: it.images,
    aired: it.aired,
    status: it.status,
    season: it.season,
    year: it.year,
    episodes: typeof it.episodes === 'number' ? it.episodes : null,
    studios: Array.isArray(it.studios) ? it.studios.map((s: any) => ({ name: s?.name })) : [],
    type: it.type,
  }))
  return dedupeByMalId(items)
}

/**
 * Trae varias páginas de una temporada de Jikan y las combina (deduplicadas).
 * Útil para "próximos estrenos": incluye también títulos poco conocidos.
 * `path` debe ser la ruta base sin `page` (p. ej. `/seasons/upcoming`).
 */
export async function fetchSeasonPages(
  path: string,
  pages = 3,
  limit = 25,
  revalidate = 21600,
): Promise<JikanAnime[]> {
  const sep = path.includes('?') ? '&' : '?'
  const reqs = Array.from({ length: pages }, (_, i) =>
    fetchJikan(`${path}${sep}limit=${limit}&page=${i + 1}`, revalidate),
  )
  const results = await Promise.allSettled(reqs)
  const all: JikanAnime[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...mapJikanList(r.value))
  }
  return dedupeByMalId(all)
}

export function mapRecommendations(data: any): JikanAnime[] {
  if (!data?.data) return []
  const items: JikanAnime[] = []
  for (const rec of data.data) {
    const mal_id = rec.entry?.mal_id
    const title = rec.entry?.title
    if (!mal_id || !title) continue
    items.push({
      mal_id,
      title,
      images: rec.entry?.images,
      score: undefined,
    })
  }
  return dedupeByMalId(items).slice(0, 6)
}

export function mapMangaList(data: any): JikanManga[] {
  if (!data?.data) return []
  const items = data.data.map((it: any) => ({
    mal_id: it.mal_id,
    title: it.title,
    synopsis: it.synopsis,
    score: it.score,
    images: it.images,
    chapters: it.chapters,
    volumes: it.volumes,
  }))
  return dedupeByMalId(items)
}

export function getSeasonLabel(): string {
  const m = new Date().getMonth()
  if (m >= 0 && m <= 2) return 'winter'
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  return 'fall'
}

export const SEASON_NAMES: Record<string, string> = {
  winter: 'Invierno',
  spring: 'Primavera',
  summer: 'Verano',
  fall: 'Otoño',
}
