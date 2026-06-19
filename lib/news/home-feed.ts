import { fetchNews, type NewsCategory, type NewsItem } from '../rss'

export type HomeNewsItem = NewsItem & {
  external?: boolean
}

function parseDate(value?: string): number {
  if (!value) return 0
  const t = Date.parse(value)
  return Number.isNaN(t) ? 0 : t
}

function dedupeByTitle(items: HomeNewsItem[]): HomeNewsItem[] {
  const seen = new Set<string>()
  const out: HomeNewsItem[] = []
  for (const item of items) {
    const key = item.title.toLowerCase().slice(0, 80)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

async function fetchRssHome(limit: number): Promise<HomeNewsItem[]> {
  const categories: NewsCategory[] = ['collect', 'gaming', 'tech']
  const perCategory = Math.ceil(limit / categories.length) + 2
  const batches = await Promise.all(categories.map((c) => fetchNews(c, perCategory)))
  return batches.flat().map((item) => ({ ...item, external: false }))
}

/** Noticias para el feed de inicio — solo fuentes RSS gratuitas */
export async function fetchHomeNews(limit = 10): Promise<HomeNewsItem[]> {
  const rss = await fetchRssHome(limit)
  return dedupeByTitle(rss)
    .sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt))
    .slice(0, limit)
}

export async function fetchAllNews(limit = 12): Promise<HomeNewsItem[]> {
  return fetchHomeNews(limit)
}

export function newsHref(item: HomeNewsItem): string {
  return `/noticias/${item.category}/${item.slug}`
}
