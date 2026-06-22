import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import { createClient, isSupabaseAuthConfigured } from '../supabase/server'

export type UgcReviewItem = {
  id: number
  user_id: string
  content_type: string
  content_id: string
  rating_global: number
  comment: string
  is_spoiler: boolean
  status: string
  created_at: string
  author_name: string
  author_username: string | null
}

export async function listPendingUgcReviews(limit = 50): Promise<UgcReviewItem[]> {
  if (!isSupabaseAuthConfigured()) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_reviews')
    .select(
      'id, user_id, content_type, content_id, rating_global, comment, is_spoiler, status, created_at, profiles(display_name, username)',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    if (error.code === '42703') return []
    throw error
  }

  return (data || []).map((row) => {
    const profile = row.profiles as { display_name?: string | null; username?: string | null } | null
    return {
      id: row.id,
      user_id: row.user_id,
      content_type: row.content_type,
      content_id: row.content_id,
      rating_global: row.rating_global,
      comment: row.comment,
      is_spoiler: row.is_spoiler,
      status: row.status,
      created_at: row.created_at,
      author_name: profile?.display_name || 'Fan',
      author_username: profile?.username ?? null,
    }
  })
}

export async function setUgcReviewStatus(reviewId: number, status: 'published' | 'rejected') {
  if (!isSupabaseConfigured()) throw new Error('Supabase no configurado')

  const admin = getSupabaseAdmin()
  const { error } = await admin.from('user_reviews').update({ status }).eq('id', reviewId)

  if (error) throw error
}
