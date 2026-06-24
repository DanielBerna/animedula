import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import {
  countUnreadMessages,
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../../lib/social/friends'
import { isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ notifications: [], unread_notifications: 0, unread_messages: 0 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const [notifications, unread_notifications, unread_messages] = await Promise.all([
    listNotifications(user.id),
    countUnreadNotifications(user.id),
    countUnreadMessages(user.id),
  ])

  return Response.json({ notifications, unread_notifications, unread_messages })
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const action = String(body.action || '')

  if (action === 'read_all') {
    await markAllNotificationsRead(user.id)
    return Response.json({ ok: true })
  }

  if (action === 'read') {
    const id = Number(body.id)
    if (!Number.isFinite(id)) {
      return Response.json({ error: 'id inválido' }, { status: 400 })
    }
    await markNotificationRead(user.id, id)
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Acción no válida' }, { status: 400 })
}
