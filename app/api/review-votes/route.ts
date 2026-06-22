import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { requireRateLimit } from '../../../lib/security/api'

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'review-votes')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Votos no disponibles' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const { review_id, vote_type } = await req.json()
  const rid = Number(review_id)
  if (!Number.isFinite(rid) || !['up', 'down'].includes(vote_type)) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('review_votes')
    .select('id, vote_type')
    .eq('user_id', user.id)
    .eq('review_id', rid)
    .maybeSingle()

  if (existing) {
    if (existing.vote_type === vote_type) {
      await supabase.from('review_votes').delete().eq('id', existing.id)
      return Response.json({ removed: true })
    }
    const { error } = await supabase
      .from('review_votes')
      .update({ vote_type })
      .eq('id', existing.id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ updated: true })
  }

  const { error } = await supabase.from('review_votes').insert({
    user_id: user.id,
    review_id: rid,
    vote_type,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ created: true })
}
