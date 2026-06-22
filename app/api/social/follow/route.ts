import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { requireRateLimit } from '../../../../lib/security/api'
import { followUser, unfollowUser, getFollowStats } from '../../../../lib/social/follows'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ follower_count: 0, following_count: 0, is_following: false })
  }

  const url = new URL(req.url)
  const userId = url.searchParams.get('user_id') || ''
  if (!userId) {
    return Response.json({ error: 'Falta user_id' }, { status: 400 })
  }

  const viewer = await getAuthUser()
  const stats = await getFollowStats(userId, viewer?.id)
  return Response.json(stats)
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'social-follow')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Social no disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const followingId = String(body.following_id || body.user_id || '')

  if (!followingId) {
    return Response.json({ error: 'Falta following_id' }, { status: 400 })
  }

  try {
    await followUser(user.id, followingId)
    const stats = await getFollowStats(followingId, user.id)
    return Response.json({ ok: true, ...stats })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo seguir'
    return Response.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'social-follow')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Social no disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const url = new URL(req.url)
  const followingId = url.searchParams.get('user_id') || ''
  if (!followingId) {
    return Response.json({ error: 'Falta user_id' }, { status: 400 })
  }

  try {
    await unfollowUser(user.id, followingId)
    const stats = await getFollowStats(followingId, user.id)
    return Response.json({ ok: true, ...stats })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo dejar de seguir'
    return Response.json({ error: message }, { status: 400 })
  }
}
