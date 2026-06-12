const JIKAN_UA = 'Animedula/1.0 (anime-manga-es; +https://github.com/animedula)'

function buildJikanUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `https://api.jikan.moe/v4${normalized}`
}

export async function fetchJikan(path: string, revalidate = 21600) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(buildJikanUrl(path), {
      headers: { 'User-Agent': JIKAN_UA, Accept: 'application/json' },
      signal: controller.signal,
      next: revalidate > 0 ? { revalidate } : undefined,
      cache: revalidate === 0 ? 'no-store' : 'default',
    })

    clearTimeout(timer)
    if (!res.ok) {
      console.warn(`[jikan] ${res.status} ${path}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.warn(`[jikan] error ${path}`, err)
    return null
  }
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

export type JikanAnime = {
  mal_id: number
  title: string
  synopsis?: string
  score?: number
  images?: JikanImages
  aired?: { from?: string }
  status?: string
  season?: string
  year?: number
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
  }))
  return dedupeByMalId(items)
}

export function mapRecommendations(data: any): JikanAnime[] {
  if (!data?.data) return []
  const items = data.data.map((rec: any) => ({
    mal_id: rec.entry?.mal_id,
    title: rec.entry?.title,
    images: rec.entry?.images,
    score: undefined,
  })).filter((a: JikanAnime) => a.mal_id && a.title)
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
