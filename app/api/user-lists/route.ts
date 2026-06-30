import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { requireRateLimit } from '../../../lib/security/api'
import { isAllowedAvatarUrl } from '../../../lib/security/urls'
import { awardActivityCoins } from '../../../lib/gamification/award-activity'

const VALID_STATUS = ['pending', 'watching', 'completed', 'dropped'] as const
const VALID_TYPES = ['anime', 'manga', 'game', 'movie'] as const

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'user-lists')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Listas no disponibles aún' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const content_type = body.content_type as string
  const content_id = String(body.content_id || '')
  const title = String(body.title || '').slice(0, 200)
  const image_url = body.image_url ? String(body.image_url) : null
  if (image_url && !isAllowedAvatarUrl(image_url)) {
    return Response.json({ error: 'URL de imagen no permitida' }, { status: 400 })
  }
  const status = body.status as string

  if (!VALID_TYPES.includes(content_type as typeof VALID_TYPES[number])) {
    return Response.json({ error: 'Tipo de contenido no válido' }, { status: 400 })
  }
  if (!content_id || !title) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (!VALID_STATUS.includes(status as typeof VALID_STATUS[number])) {
    return Response.json({ error: 'Estado no válido' }, { status: 400 })
  }

  const supabase = await createClient()
  const now = new Date().toISOString()
  const payload = {
    user_id: user.id,
    content_type,
    content_id,
    title,
    image_url,
    status,
    updated_at: now,
  }

  const { data: existing } = await supabase
    .from('user_lists')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .maybeSingle()

  const { data, error } = existing
    ? await supabase
        .from('user_lists')
        .update({ title, image_url, status, updated_at: now })
        .eq('id', existing.id)
        .select('id, status')
        .single()
    : await supabase.from('user_lists').insert(payload).select('id, status').single()

  if (error) {
    if (error.code === '42P01') {
      return Response.json(
        { error: 'Ejecuta supabase/schema-v2-community.sql en tu proyecto Supabase' },
        { status: 503 },
      )
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  // XP por marcar completado (si existe la función)
  if (status === 'completed') {
    await supabase.rpc('award_xp', { p_user_id: user.id, p_amount: 5, p_reason: 'completed' })
  }

  const coins = await awardActivityCoins(supabase, user.id, 'list')
  return Response.json({ list: data, coins_awarded: coins?.awarded ?? 0 })
}
