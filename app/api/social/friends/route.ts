import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { requireRateLimit } from '../../../../lib/security/api'
import {
  getFriendStatus,
  listFriends,
  respondFriendRequest,
  sendFriendRequest,
  type FriendStatus,
} from '../../../../lib/social/friends'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ friends: [], status: 'none' })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const url = new URL(req.url)
  const targetId = url.searchParams.get('user_id')

  const friends = await listFriends(user.id)

  if (targetId) {
    const status = await getFriendStatus(user.id, targetId)
    return Response.json({ friends, status })
  }

  return Response.json({ friends })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'social-friends')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const targetId = String(body.user_id || '')
  const action = String(body.action || 'send')

  if (!targetId) return Response.json({ error: 'Falta user_id' }, { status: 400 })

  try {
    if (action === 'accept') {
      await respondFriendRequest(user.id, targetId, true)
      return Response.json({ status: 'friends' as FriendStatus })
    }
    if (action === 'reject') {
      await respondFriendRequest(user.id, targetId, false)
      return Response.json({ status: 'none' as FriendStatus })
    }
    await sendFriendRequest(user.id, targetId)
    return Response.json({ status: 'pending_sent' as FriendStatus })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error'
    return Response.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'social-friends')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const url = new URL(req.url)
  const targetId = url.searchParams.get('user_id') || ''
  if (!targetId) return Response.json({ error: 'Falta user_id' }, { status: 400 })

  const supabase = await createClient()
  await supabase
    .from('friend_requests')
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`,
    )
    .eq('status', 'pending')

  return Response.json({ status: 'none' as FriendStatus })
}
