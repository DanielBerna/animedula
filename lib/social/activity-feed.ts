import { createServiceClient } from '../supabase/service'
import { listFollowingIds } from './follows'

export type ActivityItem = {
  id: string
  type: 'review' | 'forum' | 'list'
  title: string
  excerpt: string
  href: string
  author: string
  authorUsername: string | null
  created_at: string
}

const CONTENT_BASES: Record<string, string> = {
  anime: '/anime',
  manga: '/mangas',
  game: '/videojuegos',
  movie: '/cine',
}

function contentHref(type: string, id: string): string {
  return `${CONTENT_BASES[type] || '/explorar'}/${id}`
}

export async function getFollowingActivityFeed(userId: string, limit = 25): Promise<ActivityItem[]> {
  const followingIds = await listFollowingIds(userId)
  if (followingIds.length === 0) return []

  const supabase = createServiceClient()
  if (!supabase) return []

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [reviewsRes, forumRes, listsRes] = await Promise.all([
    supabase
      .from('user_reviews')
      .select('id, content_type, content_id, rating_global, comment, created_at, profiles(display_name, username)')
      .in('user_id', followingIds)
      .eq('status', 'published')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('forum_posts')
      .select('id, title, body, content_type, content_id, created_at, profiles(display_name, username)')
      .in('user_id', followingIds)
      .is('parent_id', null)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('user_lists')
      .select('content_type, content_id, title, status, updated_at, profiles(display_name, username)')
      .in('user_id', followingIds)
      .in('status', ['watching', 'completed'])
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(limit),
  ])

  const items: ActivityItem[] = []

  for (const row of reviewsRes.data || []) {
    const profile = row.profiles as { display_name?: string | null; username?: string | null } | null
    items.push({
      id: `review-${row.id}`,
      type: 'review',
      title: `Reseña ★ ${row.rating_global}/10`,
      excerpt: row.comment.slice(0, 160),
      href: contentHref(row.content_type, row.content_id),
      author: profile?.display_name || 'Fan',
      authorUsername: profile?.username ?? null,
      created_at: row.created_at,
    })
  }

  for (const row of forumRes.data || []) {
    const profile = row.profiles as { display_name?: string | null; username?: string | null } | null
    let href = '/comunidad'
    if (row.content_type && row.content_id) {
      href = contentHref(row.content_type, String(row.content_id))
    }
    items.push({
      id: `forum-${row.id}`,
      type: 'forum',
      title: row.title,
      excerpt: row.body.slice(0, 160),
      href,
      author: profile?.display_name || 'Fan',
      authorUsername: profile?.username ?? null,
      created_at: row.created_at,
    })
  }

  for (const row of listsRes.data || []) {
    const profile = row.profiles as { display_name?: string | null; username?: string | null } | null
    items.push({
      id: `list-${row.content_type}-${row.content_id}-${row.updated_at}`,
      type: 'list',
      title: row.status === 'completed' ? `Completó: ${row.title}` : `Viendo: ${row.title}`,
      excerpt: row.title,
      href: contentHref(row.content_type, row.content_id),
      author: profile?.display_name || 'Fan',
      authorUsername: profile?.username ?? null,
      created_at: row.updated_at,
    })
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return items.slice(0, limit)
}
