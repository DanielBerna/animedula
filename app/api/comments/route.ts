import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { requireRateLimit } from '../../../lib/security/api'
import { moderateUserText } from '../../../lib/security/content-moderation'
import { awardActivityCoins } from '../../../lib/gamification/award-activity'

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ comments: [] })
  }

  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')
  const malId = url.searchParams.get('mal_id')
  if (!kind || !malId) {
    return Response.json({ error: 'kind y mal_id requeridos' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, parent_id, profiles(display_name, avatar_url, username)')
    .eq('kind', kind)
    .eq('mal_id', Number(malId))
    .eq('status', 'visible')
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ comments: data || [] })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'comments')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Comentarios no disponibles aún' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión para comentar' }, { status: 401 })

  const { kind, mal_id, body, parent_id } = await req.json()
  if (!kind || !mal_id || !body?.trim()) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const text = String(body).trim().slice(0, 2000)
  const mod = moderateUserText(text, { minLength: 2, maxLength: 2000 })
  if (mod.ok === false) return Response.json({ error: mod.reason }, { status: 400 })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .insert({
      kind,
      mal_id: Number(mal_id),
      user_id: user.id,
      body: text,
      parent_id: parent_id || null,
    })
    .select('id, body, created_at, parent_id, profiles(display_name, avatar_url, username)')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const coins = await awardActivityCoins(supabase, user.id, 'comment')
  return Response.json({ comment: data, coins_awarded: coins?.awarded ?? 0 })
}
