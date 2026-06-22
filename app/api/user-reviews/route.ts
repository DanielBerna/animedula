import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { requireRateLimit } from '../../../lib/security/api'

const VALID_TYPES = ['anime', 'manga', 'game', 'movie'] as const

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ reviews: [] })
  }

  const url = new URL(req.url)
  const content_type = url.searchParams.get('content_type') || ''
  const content_id = url.searchParams.get('content_id') || ''
  if (!VALID_TYPES.includes(content_type as typeof VALID_TYPES[number]) || !content_id) {
    return Response.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const user = await getAuthUser()
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('user_reviews')
    .select('id, user_id, rating_global, metrics_json, comment, is_spoiler, status, created_at, profiles(display_name)')
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    if (error.code === '42P01') {
      return Response.json({ reviews: [], hint: 'Ejecuta schema-v2-community.sql' })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  const ids = (reviews || []).map((r) => r.id)
  let votes: { review_id: number; vote_type: string; user_id: string }[] = []

  if (ids.length > 0) {
    const { data: voteRows } = await supabase
      .from('review_votes')
      .select('review_id, vote_type, user_id')
      .in('review_id', ids)
    votes = voteRows || []
  }

  const enriched = (reviews || []).map((r) => {
    const rv = votes.filter((v) => v.review_id === r.id)
    const up_count = rv.filter((v) => v.vote_type === 'up').length
    const down_count = rv.filter((v) => v.vote_type === 'down').length
    const mine = user ? rv.find((v) => v.user_id === user.id) : undefined
    return {
      ...r,
      up_count,
      down_count,
      user_vote: mine?.vote_type as 'up' | 'down' | null ?? null,
    }
  })

  enriched.sort((a, b) => {
    const scoreA = a.up_count - a.down_count
    const scoreB = b.up_count - b.down_count
    if (scoreB !== scoreA) return scoreB - scoreA
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return Response.json({ reviews: enriched })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'user-reviews')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Reseñas no disponibles aún' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const content_type = body.content_type as string
  const content_id = String(body.content_id || '')
  const rating_global = Number(body.rating_global)
  const comment = String(body.comment || '').trim()
  const is_spoiler = Boolean(body.is_spoiler)
  const metrics_json = body.metrics_json && typeof body.metrics_json === 'object' ? body.metrics_json : {}

  if (!VALID_TYPES.includes(content_type as typeof VALID_TYPES[number])) {
    return Response.json({ error: 'Tipo no válido' }, { status: 400 })
  }
  if (!content_id || !Number.isFinite(rating_global) || rating_global < 1 || rating_global > 10) {
    return Response.json({ error: 'Nota inválida' }, { status: 400 })
  }
  if (comment.length < 20 || comment.length > 4000) {
    return Response.json({ error: 'La reseña debe tener entre 20 y 4000 caracteres' }, { status: 400 })
  }

  const supabase = await createClient()
  const payload = {
    user_id: user.id,
    content_type,
    content_id,
    rating_global,
    metrics_json,
    comment,
    is_spoiler,
    status: 'pending' as const,
  }

  const { data: existing } = await supabase
    .from('user_reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .maybeSingle()

  const { data, error } = existing
    ? await supabase
        .from('user_reviews')
        .update({
          rating_global,
          metrics_json,
          comment,
          is_spoiler,
          status: 'pending',
        })
        .eq('id', existing.id)
        .select('id, status')
        .single()
    : await supabase.from('user_reviews').insert(payload).select('id, status').single()

  if (error) {
    if (error.code === '42P01') {
      return Response.json({ error: 'Ejecuta schema-v2-community.sql en Supabase' }, { status: 503 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ review: data, pending: data?.status === 'pending' })
}
