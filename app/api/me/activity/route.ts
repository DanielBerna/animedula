import { getAuthUser } from '../../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

type ReviewRow = {
  id: number
  content_type: string
  content_id: string
  rating_global: number
  comment: string
  status: string
  created_at: string
}

type ThreadRow = {
  id: number
  title: string
  reply_count: number
  content_type: string | null
  content_id: string | null
  tags: string[] | null
  created_at: string
}

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ reviews: [], threads: [], comment_count: 0 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ reviews: [], threads: [], comment_count: 0 })

  const supabase = await createClient()

  const [reviewsRes, threadsRes, commentCountRes] = await Promise.all([
    supabase
      .from('user_reviews')
      .select('id, content_type, content_id, rating_global, comment, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('forum_posts')
      .select('id, title, reply_count, content_type, content_id, tags, created_at')
      .eq('user_id', user.id)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const reviews = (reviewsRes.data as ReviewRow[] | null) || []
  const threads = (threadsRes.data as ThreadRow[] | null) || []
  const comment_count = commentCountRes.count ?? 0

  return Response.json({ reviews, threads, comment_count })
}
