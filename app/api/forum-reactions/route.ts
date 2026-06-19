import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'

const VALID_EMOJI = ['hype', 'sad_otaku', 'gg'] as const

export async function POST(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Reacciones no disponibles' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const { post_id, emoji } = await req.json()
  const pid = Number(post_id)
  if (!Number.isFinite(pid) || !VALID_EMOJI.includes(emoji)) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', pid)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_reactions').delete().eq('id', existing.id)
    return Response.json({ removed: true })
  }

  const { error } = await supabase.from('post_reactions').insert({
    user_id: user.id,
    post_id: pid,
    emoji,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ created: true })
}
