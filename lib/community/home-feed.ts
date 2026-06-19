import { fetchHomeNews, newsHref, type HomeNewsItem } from '../news/home-feed'
import { getCommunityHighlights, type CommunityHighlight } from './feed'

export type HybridFeedItem = {
  id: string
  title: string
  excerpt?: string
  href: string
  author?: string
  source: 'news' | 'comment' | 'forum' | 'review'
  sourceLabel: string
  publishedAt: string
  external?: boolean
}

function newsToFeed(item: HomeNewsItem): HybridFeedItem {
  return {
    id: item.id,
    title: item.title,
    excerpt: item.summary,
    href: newsHref(item),
    source: 'news',
    sourceLabel: item.source,
    publishedAt: item.publishedAt || new Date().toISOString(),
    external: item.external,
  }
}

function communityToFeed(item: CommunityHighlight): HybridFeedItem {
  const labels = { comment: 'Comentario', forum: 'Foro', review: 'Reseña' }
  return {
    id: item.id,
    title: item.body.slice(0, 140),
    excerpt: item.body.length > 140 ? `${item.body.slice(0, 200)}…` : undefined,
    href: item.href,
    author: item.author,
    source: item.source,
    sourceLabel: labels[item.source],
    publishedAt: item.created_at,
  }
}

/** Feed híbrido: noticias + comunidad, ordenado por fecha */
export async function getHybridHomeFeed(newsLimit = 8, communityLimit = 5): Promise<HybridFeedItem[]> {
  const [news, community] = await Promise.all([
    fetchHomeNews(newsLimit),
    getCommunityHighlights(communityLimit),
  ])

  const items = [...news.map(newsToFeed), ...community.map(communityToFeed)]
  items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  return items.slice(0, newsLimit + communityLimit)
}
