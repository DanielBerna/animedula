import type { NewsCategory, NewsItem } from '../rss'

export type NewsFilterCategory = NewsCategory | 'all'

export function filterNewsItems(
  items: NewsItem[],
  query: string,
  category: NewsFilterCategory = 'all',
): NewsItem[] {
  const q = query.trim().toLowerCase()
  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false
    if (!q) return true
    const haystack = [item.title, item.summary, item.source].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  collect: 'Anime',
  gaming: 'Videojuegos',
  tech: 'Tecnología',
}

export const NEWS_CATEGORY_CLASS: Record<NewsCategory, string> = {
  collect: 'news-cat-collect',
  gaming: 'news-cat-gaming',
  tech: 'news-cat-tech',
}
