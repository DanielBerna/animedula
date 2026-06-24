import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { getEquippedBordersForUsers } from '../../../lib/gamification/cosmetics'
import { requireRateLimit } from '../../../lib/security/api'

const VALID_TAGS = ['manga', 'gaming', 'spoilers', 'tecnologia', 'anime'] as const

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ posts: [] })
  }

  const url = new URL(req.url)
  const content_type = url.searchParams.get('content_type')
  const content_id = url.searchParams.get('content_id')
  const tag = url.searchParams.get('tag')
  const parent_id = url.searchParams.get('parent_id')

  const supabase = await createClient()
  let query = supabase
    .from('forum_posts')
    .select('id, title, body, tags, content_id, content_type, reply_count, created_at, user_id, parent_id, profiles(display_name, status_text, current_action, username, selected_title, avatar_url)')
    .is('parent_id', parent_id ? Number(parent_id) : null)
    .order('created_at', { ascending: false })
    .limit(30)

  if (content_type && content_id) {
    query = query.eq('content_type', content_type).eq('content_id', content_id)
  } else if (!parent_id) {
    query = query.is('content_id', null)
  }

  if (tag && VALID_TAGS.includes(tag as typeof VALID_TAGS[number])) {
    query = query.contains('tags', [tag])
  }

  const { data: posts, error } = await query

  if (error) {
    if (error.code === '42P01') {
      return Response.json({ posts: [], hint: 'Ejecuta schema-v2-community.sql' })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  const ids = (posts || []).map((p) => p.id)
  const userIds = [...new Set((posts || []).map((p) => p.user_id))]
  let reactions: { post_id: number; emoji: string; user_id: string }[] = []
  const user = await getAuthUser()
  const borders = await getEquippedBordersForUsers(userIds)

  if (ids.length > 0) {
    const { data: rx } = await supabase
      .from('post_reactions')
      .select('post_id, emoji, user_id')
      .in('post_id', ids)
    reactions = rx || []
  }

  const enriched = (posts || []).map((p) => {
    const pr = reactions.filter((r) => r.post_id === p.id)
    const reactionMap: Record<string, number> = {}
    for (const r of pr) {
      reactionMap[r.emoji] = (reactionMap[r.emoji] || 0) + 1
    }
    const user_reactions = user
      ? pr.filter((r) => r.user_id === user.id).map((r) => r.emoji)
      : []
    return { ...p, reactions: reactionMap, user_reactions, author_border: borders[p.user_id] || null }
  })

  return Response.json({ posts: enriched })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'forum-posts')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Foro no disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const title = String(body.title || '').trim()
  const text = String(body.body || '').trim()
  const tags = Array.isArray(body.tags) ? body.tags.filter((t: string) => VALID_TAGS.includes(t as typeof VALID_TAGS[number])) : []
  const content_type = body.content_type ? String(body.content_type) : null
  const content_id = body.content_id ? String(body.content_id) : null
  const parent_id = body.parent_id ? Number(body.parent_id) : null

  if (parent_id) {
    if (text.length < 10 || text.length > 8000) {
      return Response.json({ error: 'La respuesta debe tener entre 10 y 8000 caracteres' }, { status: 400 })
    }
  } else {
    if (title.length < 5 || title.length > 200) {
      return Response.json({ error: 'El título debe tener entre 5 y 200 caracteres' }, { status: 400 })
    }
    if (text.length < 10 || text.length > 8000) {
      return Response.json({ error: 'El cuerpo debe tener entre 10 y 8000 caracteres' }, { status: 400 })
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('forum_posts')
    .insert({
      user_id: user.id,
      title: parent_id ? `Re: ${title.slice(0, 180)}` : title,
      body: text,
      tags,
      content_type,
      content_id,
      parent_id,
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ post: data })
}
