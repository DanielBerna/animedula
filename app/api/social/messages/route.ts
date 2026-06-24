import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { requireRateLimit } from '../../../../lib/security/api'
import { listMessages, markConversationRead, sendMessage } from '../../../../lib/social/friends'
import { isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function GET(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ messages: [] })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const url = new URL(req.url)
  const withUserId = url.searchParams.get('with') || ''
  if (!withUserId) return Response.json({ error: 'Falta with' }, { status: 400 })

  const messages = await listMessages(user.id, withUserId)
  await markConversationRead(user.id, withUserId)
  return Response.json({ messages })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'social-messages')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'No disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const recipientId = String(body.recipient_id || '')
  const text = String(body.body || '').trim()

  if (!recipientId || text.length < 1) {
    return Response.json({ error: 'Mensaje vacío' }, { status: 400 })
  }

  try {
    const message = await sendMessage(user.id, recipientId, text)
    return Response.json({ message })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo enviar'
    return Response.json({ error: message }, { status: 400 })
  }
}
