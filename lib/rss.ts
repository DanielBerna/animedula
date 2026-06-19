import { looksSpanish, translateToSpanish } from './translate'

export type NewsCategory = 'gaming' | 'tech' | 'collect'

export type NewsItem = {
  id: string
  slug: string
  title: string
  link: string
  source: string
  publishedAt?: string
  summary?: string
  imageUrl?: string
  category: NewsCategory
}

type FeedConfig = {
  name: string
  url: string
  lang: 'es' | 'en'
}

/** Fuentes en español primero; respaldo en inglés con traducción */
export const RSS_FEEDS: Record<NewsCategory, FeedConfig[]> = {
  gaming: [
    { name: 'Eurogamer ES', url: 'https://www.eurogamer.es/feed', lang: 'es' },
    { name: 'LevelUp', url: 'https://www.levelup.com/feed/', lang: 'es' },
    { name: 'Nintenderos', url: 'https://www.nintenderos.com/feed/', lang: 'es' },
    { name: 'Polygon', url: 'https://www.polygon.com/rss/gaming/index.xml', lang: 'en' },
  ],
  tech: [
    { name: 'Xataka', url: 'https://www.xataka.com/index.xml', lang: 'es' },
    { name: 'Genbeta', url: 'https://www.genbeta.com/index.xml', lang: 'es' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', lang: 'en' },
  ],
  collect: [
    { name: 'Ramen Para Dos', url: 'https://ramenparados.com/feed/', lang: 'es' },
    { name: 'Kudasai', url: 'https://somoskudasai.com/feed/', lang: 'es' },
    { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/news/rss.xml', lang: 'en' },
  ],
}

export function newsSlug(link: string): string {
  let hash = 0
  for (let i = 0; i < link.length; i++) {
    hash = (hash * 31 + link.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

function decodeHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractRawTag(block: string, tag: string): string {
  const cdata = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'))
  if (cdata?.[1]) return cdata[1]
  const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return plain?.[1] || ''
}

function normalizeImageUrl(raw: string): string {
  const url = raw.replace(/&amp;/g, '&').trim()
  if (url.startsWith('//')) return `https:${url}`
  return url
}

function extractImageUrl(block: string): string | undefined {
  const mediaThumb = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)
  if (mediaThumb?.[1]) return normalizeImageUrl(mediaThumb[1])

  const mediaContent = block.match(/<media:content[^>]+url=["']([^"']+)["']/i)
  if (mediaContent?.[1]) return normalizeImageUrl(mediaContent[1])

  const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*\/?>/i)
  if (enclosure?.[1] && /image|jpg|jpeg|png|webp|gif/i.test(enclosure[0])) {
    return normalizeImageUrl(enclosure[1])
  }

  const rawDesc =
    extractRawTag(block, 'content:encoded') || extractRawTag(block, 'description')
  const img = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (img?.[1]) return normalizeImageUrl(img[1])

  return undefined
}

function extractTag(block: string, tag: string): string {
  const raw = extractRawTag(block, tag)
  return raw ? decodeHtml(raw) : ''
}

function parseRssXml(xml: string, source: string, category: NewsCategory, limit: number): NewsItem[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || []
  const items: NewsItem[] = []

  for (const block of blocks.slice(0, limit)) {
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    if (!title || !link) continue
    const pubDate = extractTag(block, 'pubDate')
    const summary = extractTag(block, 'description').slice(0, 320)
    const imageUrl = extractImageUrl(block)
    items.push({
      id: `${source}-${link}`,
      slug: newsSlug(link),
      title,
      link,
      source,
      publishedAt: pubDate || undefined,
      summary: summary || undefined,
      imageUrl,
      category,
    })
  }

  return items
}

export async function fetchRssFeed(
  url: string,
  source: string,
  category: NewsCategory,
  lang: 'es' | 'en',
  limit = 6,
  revalidate = 7200,
): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Animedula/1.0 (rss-reader)' },
      next: { revalidate },
    })
    if (!res.ok) {
      console.warn(`[rss] ${res.status} ${source}`)
      return []
    }
    const xml = await res.text()
    const items = parseRssXml(xml, source, category, limit)
    if (lang === 'es') return items
    return localizeNewsItems(items)
  } catch (err) {
    console.warn(`[rss] error ${source}`, err)
    return []
  }
}

async function localizeNewsItem(item: NewsItem): Promise<NewsItem> {
  const [title, summary] = await Promise.all([
    looksSpanish(item.title) ? item.title : translateToSpanish(item.title),
    item.summary
      ? looksSpanish(item.summary)
        ? item.summary
        : translateToSpanish(item.summary)
      : Promise.resolve(undefined),
  ])
  return { ...item, title, summary }
}

export async function localizeNewsItems(items: NewsItem[]): Promise<NewsItem[]> {
  const out: NewsItem[] = []
  for (const item of items) {
    out.push(await localizeNewsItem(item))
  }
  return out
}

function parseDate(value?: string): number {
  if (!value) return 0
  const t = Date.parse(value)
  return Number.isNaN(t) ? 0 : t
}

export async function fetchNews(category: NewsCategory, limit = 8): Promise<NewsItem[]> {
  const feeds = RSS_FEEDS[category]
  const batches = await Promise.allSettled(
    feeds.map((f) => fetchRssFeed(f.url, f.name, category, f.lang, limit)),
  )

  const merged: NewsItem[] = []
  const seen = new Set<string>()

  for (const batch of batches) {
    if (batch.status !== 'fulfilled') continue
    for (const item of batch.value) {
      const key = item.title.toLowerCase().slice(0, 80)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
  }

  return merged
    .sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt))
    .slice(0, limit)
}

export async function fetchNewsBySlug(
  category: NewsCategory,
  slug: string,
): Promise<NewsItem | null> {
  const items = await fetchNews(category, 48)
  return items.find((item) => item.slug === slug) || null
}

export function isNewsCategory(value: string): value is NewsCategory {
  return value === 'gaming' || value === 'tech' || value === 'collect'
}
