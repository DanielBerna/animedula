import { getBestImageUrl } from './jikan'

export type ShowcaseSearchResult = {
  id: string
  title: string
  image_url: string | null
}

export type ShowcaseSection = 'anime' | 'manga' | 'game'

export async function searchShowcaseContent(
  section: ShowcaseSection,
  query: string,
): Promise<ShowcaseSearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  if (section === 'game') {
    const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}&limit=10`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []) as ShowcaseSearchResult[]
  }

  const path =
    section === 'anime'
      ? `/anime?q=${encodeURIComponent(q)}&limit=10&sfw=true`
      : `/manga?q=${encodeURIComponent(q)}&limit=10&sfw=true`

  const res = await fetch(`/api/jikan?path=${encodeURIComponent(path)}`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data?.data)) return []

  return data.data
    .map((item: { mal_id?: number; title?: string; images?: Parameters<typeof getBestImageUrl>[0] }) => {
      if (!item.mal_id || !item.title) return null
      return {
        id: String(item.mal_id),
        title: item.title,
        image_url: getBestImageUrl(item.images) || null,
      }
    })
    .filter(Boolean) as ShowcaseSearchResult[]
}

export function defaultListStatus(section: ShowcaseSection): string {
  if (section === 'manga') return 'reading'
  return 'watching'
}
