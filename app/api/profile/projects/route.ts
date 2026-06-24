import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'
import { moderateUserText } from '../../../../lib/security/content-moderation'
import { requireRateLimit } from '../../../../lib/security/api'
import { isSafeHttpsUrl } from '../../../../lib/security/urls'

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) return Response.json({ projects: [], intro: null })

  const url = new URL(req.url)
  const username = url.searchParams.get('username')

  const supabase = await createClient()
  let userId: string | null = null
  let intro: string | null = null

  if (username) {
    const { data } = await supabase
      .from('profiles')
      .select('id, projects_intro')
      .eq('username', username.toLowerCase())
      .maybeSingle()
    userId = data?.id ?? null
    intro = data?.projects_intro ?? null
  } else {
    const user = await getAuthUser()
    userId = user?.id ?? null
    if (userId) {
      const { data } = await supabase.from('profiles').select('projects_intro').eq('id', userId).maybeSingle()
      intro = data?.projects_intro ?? null
    }
  }

  if (!userId) return Response.json({ projects: [], intro: null })

  const { data } = await supabase
    .from('profile_projects')
    .select('slot, title, description, link_url')
    .eq('user_id', userId)
    .order('slot')

  return Response.json({ projects: data || [], intro })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'profile-projects')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const supabase = await createClient()

  if (typeof body.intro === 'string') {
    const intro = body.intro.trim().slice(0, 400)
    const mod = moderateUserText(intro, { minLength: 0, maxLength: 400 })
    if (mod.ok === false && intro.length > 0) return Response.json({ error: mod.reason }, { status: 400 })
    await supabase.from('profiles').update({ projects_intro: intro || null }).eq('id', user.id)
    return Response.json({ ok: true })
  }

  const slot = Number(body.slot)
  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()
  const link_url = body.link_url ? String(body.link_url).trim() : null

  if (!Number.isFinite(slot) || slot < 1 || slot > 5) {
    return Response.json({ error: 'Slot 1-5' }, { status: 400 })
  }

  if (body.clear) {
    await supabase.from('profile_projects').delete().eq('user_id', user.id).eq('slot', slot)
    return Response.json({ ok: true })
  }

  const mod = moderateUserText(`${title}\n${description}`, { minLength: 10, maxLength: 700 })
  if (mod.ok === false) return Response.json({ error: mod.reason }, { status: 400 })

  if (link_url && !isSafeHttpsUrl(link_url)) {
    return Response.json({ error: 'Enlace debe ser HTTPS' }, { status: 400 })
  }

  const { error } = await supabase.from('profile_projects').upsert(
    {
      user_id: user.id,
      slot,
      title: title.slice(0, 120),
      description: description.slice(0, 600),
      link_url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,slot' },
  )

  if (error) {
    if (error.code === '42P01') {
      return Response.json({ error: 'Ejecuta schema-v16-profile-showcase.sql' }, { status: 503 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
