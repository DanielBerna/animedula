import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'
import { createClient, isSupabaseAuthConfigured } from '../supabase/server'
import { EditorialReview, MediaKind } from './types'

type ReviewRow = {
  id: string
  kind: string
  mal_id: number
  status: string
  gancho: string
  por_que: string
  para_quien: string
  no_para: string
  contexto_practico: string
  veredicto: EditorialReview['veredicto']
  updated_at: string
}

export function rowToReview(row: ReviewRow): EditorialReview {
  return {
    gancho: row.gancho,
    por_que: row.por_que,
    para_quien: row.para_quien,
    no_para: row.no_para,
    contexto_mx: row.contexto_practico,
    veredicto: row.veredicto,
    firma: 'Animédula',
  }
}

export function reviewToRow(review: EditorialReview) {
  return {
    gancho: review.gancho,
    por_que: review.por_que,
    para_quien: review.para_quien,
    no_para: review.no_para,
    contexto_practico: review.contexto_mx,
    veredicto: review.veredicto,
  }
}

export async function readPublishedReviewFromDb(
  kind: MediaKind,
  id: string | number
): Promise<EditorialReview | null> {
  if (!isSupabaseAuthConfigured()) return null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('editorial_reviews')
      .select('id, kind, mal_id, status, gancho, por_que, para_quien, no_para, contexto_practico, veredicto, updated_at')
      .eq('kind', kind)
      .eq('mal_id', Number(id))
      .eq('status', 'published')
      .maybeSingle()

    if (!data) return null
    return rowToReview(data as ReviewRow)
  } catch {
    return null
  }
}

export type ModerationItem = {
  id: string
  kind: MediaKind
  mal_id: number
  title?: string
  gancho: string
  veredicto: EditorialReview['veredicto']
  status: string
  updated_at: string
}

export async function listModerationQueue(): Promise<ModerationItem[]> {
  if (!isSupabaseAuthConfigured()) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('editorial_reviews')
    .select('id, kind, mal_id, status, gancho, veredicto, updated_at')
    .in('status', ['draft', 'pending'])
    .order('updated_at', { ascending: false })
    .limit(50)

  return (data || []) as ModerationItem[]
}

export async function publishReview(reviewId: string, reviewerId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: row, error: fetchErr } = await supabase
    .from('editorial_reviews')
    .select('kind, mal_id')
    .eq('id', reviewId)
    .single()

  if (fetchErr || !row) throw fetchErr || new Error('Reseña no encontrada')

  await supabase
    .from('editorial_reviews')
    .update({ status: 'rejected', updated_at: now })
    .eq('kind', row.kind)
    .eq('mal_id', row.mal_id)
    .eq('status', 'published')
    .neq('id', reviewId)

  const { error } = await supabase
    .from('editorial_reviews')
    .update({
      status: 'published',
      published_at: now,
      reviewer_id: reviewerId,
      updated_at: now,
    })
    .eq('id', reviewId)

  if (error) throw error

  await supabase.from('review_moderation_log').insert({
    review_id: reviewId,
    actor_id: reviewerId,
    action: 'approve',
  })
}

export async function rejectReview(reviewId: string, reviewerId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('editorial_reviews')
    .update({
      status: 'rejected',
      reviewer_id: reviewerId,
      updated_at: now,
    })
    .eq('id', reviewId)

  if (error) throw error

  await supabase.from('review_moderation_log').insert({
    review_id: reviewId,
    actor_id: reviewerId,
    action: 'reject',
  })
}

export async function upsertPublishedReview(
  kind: MediaKind,
  malId: number,
  review: EditorialReview,
  reviewerId: string,
  source: 'ai' | 'human' | 'community' = 'ai'
) {
  if (!isSupabaseConfigured()) return null

  const admin = getSupabaseAdmin()
  const now = new Date().toISOString()
  const fields = reviewToRow(review)

  await admin
    .from('editorial_reviews')
    .update({ status: 'rejected', updated_at: now })
    .eq('kind', kind)
    .eq('mal_id', malId)
    .eq('status', 'published')

  const { data, error } = await admin
    .from('editorial_reviews')
    .insert({
      kind,
      mal_id: malId,
      status: 'published',
      source,
      author_id: reviewerId,
      reviewer_id: reviewerId,
      published_at: now,
      updated_at: now,
      ...fields,
    })
    .select('id')
    .single()

  if (error) throw error
  return data?.id as string
}

export async function saveDraftReview(
  kind: MediaKind,
  malId: number,
  review: EditorialReview,
  source: 'ai' | 'human' = 'ai'
) {
  if (!isSupabaseConfigured()) return null

  const admin = getSupabaseAdmin()
  const fields = reviewToRow(review)

  const { data: existing } = await admin
    .from('editorial_reviews')
    .select('id')
    .eq('kind', kind)
    .eq('mal_id', malId)
    .in('status', ['draft', 'pending'])
    .maybeSingle()

  if (existing?.id) {
    await admin
      .from('editorial_reviews')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    return existing.id as string
  }

  const { data, error } = await admin
    .from('editorial_reviews')
    .insert({
      kind,
      mal_id: malId,
      status: 'pending',
      source,
      ...fields,
    })
    .select('id')
    .single()

  if (error) throw error
  return data?.id as string
}
