import { createClient, isSupabaseAuthConfigured } from '../supabase/server'
import { getSupabaseAdmin, isSupabaseConfigured } from '../supabaseAdmin'

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends'

export async function getFriendStatus(
  viewerId: string,
  targetUserId: string,
): Promise<FriendStatus> {
  if (viewerId === targetUserId) return 'none'
  if (!isSupabaseAuthConfigured()) return 'none'

  const supabase = await createClient()
  const { data } = await supabase
    .from('friend_requests')
    .select('requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${viewerId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${viewerId})`,
    )
    .maybeSingle()

  if (!data) return 'none'
  if (data.status === 'accepted') return 'friends'
  if (data.status === 'pending') {
    return data.requester_id === viewerId ? 'pending_sent' : 'pending_received'
  }
  return 'none'
}

export async function areFriends(userA: string, userB: string): Promise<boolean> {
  const status = await getFriendStatus(userA, userB)
  return status === 'friends'
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  if (!isSupabaseAuthConfigured()) throw new Error('No disponible')
  if (requesterId === addresseeId) throw new Error('No puedes enviarte solicitud a ti mismo')

  const supabase = await createClient()
  const existing = await getFriendStatus(requesterId, addresseeId)
  if (existing === 'friends') throw new Error('Ya son amigos')
  if (existing === 'pending_sent') throw new Error('Solicitud ya enviada')
  if (existing === 'pending_received') throw new Error('Ya tienes una solicitud de esta persona')

  const { error } = await supabase.from('friend_requests').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  })

  if (error) {
    if (error.code === '42P01') throw new Error('Ejecuta schema-v14-community-enhancements.sql')
    throw error
  }

  await notifyUser(addresseeId, {
    type: 'friend_request',
    title: 'Nueva solicitud de amistad',
    body: 'Alguien quiere conectar contigo en Animédula.',
    href: '/comunidad',
  })
}

export async function respondFriendRequest(
  addresseeId: string,
  requesterId: string,
  accept: boolean,
) {
  if (!isSupabaseAuthConfigured()) throw new Error('No disponible')

  const supabase = await createClient()
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: accept ? 'accepted' : 'rejected', updated_at: new Date().toISOString() })
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId)
    .eq('status', 'pending')

  if (error) throw error

  if (accept) {
    await notifyUser(requesterId, {
      type: 'friend_accepted',
      title: 'Solicitud aceptada',
      body: 'Ya pueden enviarse mensajes.',
      href: '/comunidad',
    })
  }
}

export async function listFriends(userId: string) {
  if (!isSupabaseAuthConfigured()) return []

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('friend_requests')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (!rows?.length) return []

  const friendIds = rows.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', friendIds)

  return profiles || []
}

type NotifyPayload = { type: string; title: string; body?: string; href?: string }

async function notifyUser(userId: string, payload: NotifyPayload) {
  if (!isSupabaseConfigured()) return
  try {
    const admin = getSupabaseAdmin()
    await admin.from('notifications').insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      href: payload.href ?? null,
    })
  } catch {
    // notifications table optional until v14
  }
}

export async function listNotifications(userId: string, limit = 20) {
  if (!isSupabaseAuthConfigured()) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, href, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  if (!isSupabaseAuthConfigured()) return 0

  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  return count ?? 0
}

export async function countUnreadMessages(userId: string): Promise<number> {
  if (!isSupabaseAuthConfigured()) return 0

  const supabase = await createClient()
  const { count } = await supabase
    .from('direct_messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null)

  return count ?? 0
}

export async function markNotificationRead(userId: string, notificationId: number) {
  if (!isSupabaseAuthConfigured()) return

  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
}

export async function markAllNotificationsRead(userId: string) {
  if (!isSupabaseAuthConfigured()) return

  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
}

export async function markConversationRead(userId: string, withUserId: string) {
  if (!isSupabaseAuthConfigured()) return

  const supabase = await createClient()
  await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('sender_id', withUserId)
    .is('read_at', null)
}

export async function listMessages(userId: string, withUserId: string, limit = 50) {
  if (!isSupabaseAuthConfigured()) return []

  const friends = await areFriends(userId, withUserId)
  if (!friends) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, body, read_at, created_at')
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${withUserId}),and(sender_id.eq.${withUserId},recipient_id.eq.${userId})`,
    )
    .order('created_at', { ascending: true })
    .limit(limit)

  return data || []
}

export async function sendMessage(senderId: string, recipientId: string, body: string) {
  if (!isSupabaseAuthConfigured()) throw new Error('No disponible')

  const friends = await areFriends(senderId, recipientId)
  if (!friends) throw new Error('Solo puedes escribir a tus amigos')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      body: body.trim().slice(0, 2000),
    })
    .select('id, sender_id, recipient_id, body, read_at, created_at')
    .single()

  if (error) {
    if (error.code === '42P01') throw new Error('Ejecuta schema-v14-community-enhancements.sql')
    throw error
  }

  await notifyUser(recipientId, {
    type: 'message',
    title: 'Nuevo mensaje',
    body: body.trim().slice(0, 80),
    href: '/comunidad',
  })

  return data
}
