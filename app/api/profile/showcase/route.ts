import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'
import { requireRateLimit } from '../../../../lib/security/api'

const SECTIONS = ['anime', 'manga', 'game'] as const

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) return Response.json({ items: [] })

  const url = new URL(req.url)
  const userId = url.searchParams.get('user_id')
  const username = url.searchParams.get('username')

  const supabase = await createClient()
  let targetId = userId

  if (!targetId && username) {
    const { data } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle()
    targetId = data?.id ?? null
  }

  if (!targetId) {
    const user = await getAuthUser()
    targetId = user?.id ?? null
  }

  if (!targetId) return Response.json({ items: [] })

  const { data } = await supabase
    .from('profile_showcase')
    .select('slot, section, content_id, title, image_url, list_status')
    .eq('user_id', targetId)
    .order('section')
    .order('slot')

  return Response.json({ items: data || [] })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'profile-showcase')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const section = body.section as string
  const slot = Number(body.slot)
  const title = String(body.title || '').trim()
  const content_id = body.content_id ? String(body.content_id) : null
  const image_url = body.image_url ? String(body.image_url) : null
  const list_status = body.list_status || 'watching'

  if (!SECTIONS.includes(section as typeof SECTIONS[number])) {
    return Response.json({ error: 'Sección inválida' }, { status: 400 })
  }
  if (!Number.isFinite(slot) || slot < 1 || slot > 5) {
    return Response.json({ error: 'Slot 1-5' }, { status: 400 })
  }
  if (!title) {
    return Response.json({ error: 'Título requerido' }, { status: 400 })
  }

  const supabase = await createClient()

  if (body.clear) {
    await supabase.from('profile_showcase').delete().eq('user_id', user.id).eq('section', section).eq('slot', slot)
    return Response.json({ ok: true })
  }

  const { error } = await supabase.from('profile_showcase').upsert(
    {
      user_id: user.id,
      section,
      slot,
      title: title.slice(0, 200),
      content_id,
      image_url,
      list_status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,section,slot' },
  )

  if (error) {
    if (error.code === '42P01') {
      return Response.json({ error: 'Ejecuta schema-v16-profile-showcase.sql' }, { status: 503 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
