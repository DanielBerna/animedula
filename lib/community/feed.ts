import { createClient, isSupabaseAuthConfigured } from '../supabase/server'
import { createServiceClient } from '../supabase/service'
import { formatSeasonYear, getCurrentSeasonInfo } from '../seasons'

export type CommunityHighlight = {
  id: string
  body: string
  created_at: string
  kind: string
  author: string
  href: string
  source: 'comment' | 'forum' | 'review'
}

export type FeedItem = {
  id: string
  title: string
  excerpt: string
  href: string
  source: 'news' | 'community' | 'forum' | 'review'
  created_at: string
}

export async function getCommunityHighlights(limit = 5): Promise<CommunityHighlight[]> {
  if (!isSupabaseAuthConfigured()) return []

  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [commentsRes, forumRes, reviewsRes] = await Promise.all([
      supabase
        .from('comments')
        .select('id, body, created_at, kind, mal_id, profiles(display_name)')
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('forum_posts')
        .select('id, title, body, created_at, reply_count, content_type, content_id, profiles(display_name)')
        .is('parent_id', null)
        .gte('created_at', since)
        .gte('reply_count', 15)
        .order('reply_count', { ascending: false })
        .limit(limit),
      supabase
        .from('user_reviews')
        .select('id, comment, created_at, content_type, content_id, rating_global, profiles(display_name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit),
    ])

    const items: CommunityHighlight[] = []

    for (const row of commentsRes.data || []) {
      const profile = row.profiles as { display_name?: string } | null
      const base = row.kind === 'manga' ? '/mangas' : '/anime'
      items.push({
        id: `c-${row.id}`,
        body: row.body,
        created_at: row.created_at,
        kind: row.kind,
        author: profile?.display_name || 'Fan',
        href: `${base}/${row.mal_id}`,
        source: 'comment',
      })
    }

    for (const row of forumRes.data || []) {
      const profile = row.profiles as { display_name?: string } | null
      let href = '/comunidad'
      if (row.content_type && row.content_id) {
        const bases: Record<string, string> = { anime: '/anime', manga: '/mangas', game: '/videojuegos' }
        href = `${bases[row.content_type] || '/comunidad'}/${row.content_id}`
      }
      items.push({
        id: `f-${row.id}`,
        body: `${row.title} — ${row.body.slice(0, 120)}`,
        created_at: row.created_at,
        kind: 'forum',
        author: profile?.display_name || 'Fan',
        href,
        source: 'forum',
      })
    }

    for (const row of reviewsRes.data || []) {
      const profile = row.profiles as { display_name?: string } | null
      const bases: Record<string, string> = { anime: '/anime', manga: '/mangas', game: '/videojuegos' }
      items.push({
        id: `r-${row.id}`,
        body: `★ ${row.rating_global}/10 — ${row.comment.slice(0, 100)}`,
        created_at: row.created_at,
        kind: row.content_type,
        author: profile?.display_name || 'Fan',
        href: `${bases[row.content_type] || '/anime'}/${row.content_id}`,
        source: 'review',
      })
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return items.slice(0, limit)
  } catch {
    return []
  }
}

export type WrappedStats = {
  seasonLabel: string
  completed: number
  reviews: number
  comments: number
  xp: number
  level: number
  topTitles: { title: string; content_type: string }[]
}

export async function getWrappedStats(userId: string): Promise<WrappedStats | null> {
  const supabase = createServiceClient()
  if (!supabase) return null

  const { season, year } = getCurrentSeasonInfo()
  const seasonLabel = formatSeasonYear(season, year)
  const seasonStart = new Date(year, season === 'winter' ? 0 : season === 'spring' ? 3 : season === 'summer' ? 6 : 9, 1)

  const [{ data: profile }, { data: lists }, { data: reviews }, { count: commentCount }] = await Promise.all([
    supabase.from('profiles').select('xp, level').eq('id', userId).maybeSingle(),
    supabase
      .from('user_lists')
      .select('title, content_type, updated_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', seasonStart.toISOString())
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('user_reviews')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', seasonStart.toISOString()),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', seasonStart.toISOString()),
  ])

  return {
    seasonLabel,
    completed: lists?.length ?? 0,
    reviews: reviews?.length ?? 0,
    comments: commentCount ?? 0,
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
    topTitles: (lists || []).map((l) => ({ title: l.title, content_type: l.content_type })),
  }
}
