import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { areFriends } from '../../../../lib/social/friends'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'
import { moderateUserText } from '../../../../lib/security/content-moderation'
import { requireRateLimit } from '../../../../lib/security/api'

const SECTIONS = ['general', 'anime', 'manga', 'game', 'projects'] as const

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) return Response.json({ comments: [], can_comment: false })

  const viewer = await getAuthUser()
  const url = new URL(req.url)
  const profileUserId = url.searchParams.get('profile_user_id') || ''
  const section = url.searchParams.get('section') || 'general'

  if (!profileUserId) return Response.json({ error: 'Falta profile_user_id' }, { status: 400 })

  const isOwner = viewer?.id === profileUserId
  const isFriend = viewer ? await areFriends(viewer.id, profileUserId) : false
  const canView = isOwner || isFriend

  if (!canView) {
    return Response.json({ comments: [], can_comment: false, reason: 'friends_only' })
  }

  const supabase = await createClient()
  let query = supabase
    .from('profile_wall_comments')
    .select('id, body, section, created_at, author_id, profiles(display_name, username)')
    .eq('profile_user_id', profileUserId)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })
    .limit(50)

  if (section !== 'all') {
    query = query.eq('section', section)
  }

  const { data, error } = await query
  if (error) {
    if (error.code === '42P01') return Response.json({ comments: [], can_comment: isFriend })
    return Response.json({ error: error.message }, { status: 500 })
  }

  const comments = (data || []).map((row) => {
    const p = row.profiles as { display_name?: string | null; username?: string | null } | null
    return {
      id: row.id,
      body: row.body,
      section: row.section,
      created_at: row.created_at,
      author_id: row.author_id,
      author_name: p?.display_name || 'Fan',
      author_username: p?.username ?? null,
    }
  })

  return Response.json({
    comments,
    can_comment: isFriend && !isOwner,
  })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'profile-wall')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const profile_user_id = String(body.profile_user_id || '')
  const section = String(body.section || 'general')
  const text = String(body.body || '').trim()

  if (!profile_user_id) return Response.json({ error: 'Perfil inválido' }, { status: 400 })
  if (!SECTIONS.includes(section as typeof SECTIONS[number])) {
    return Response.json({ error: 'Sección inválida' }, { status: 400 })
  }
  if (profile_user_id === user.id) {
    return Response.json({ error: 'No puedes comentar tu propio muro así' }, { status: 400 })
  }

  const friends = await areFriends(user.id, profile_user_id)
  if (!friends) {
    return Response.json({ error: 'Solo los amigos pueden comentar en el muro' }, { status: 403 })
  }

  const mod = moderateUserText(text, { minLength: 2, maxLength: 500 })
  if (mod.ok === false) return Response.json({ error: mod.reason }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profile_wall_comments')
    .insert({
      profile_user_id,
      author_id: user.id,
      section,
      body: text,
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, id: data?.id })
}
