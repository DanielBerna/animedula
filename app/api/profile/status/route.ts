import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'
import { moderateUserText } from '../../../../lib/security/content-moderation'

const VALID_ACTIONS = ['idle', 'watching', 'reading', 'playing'] as const

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ status: null })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ status: null })

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('status_text, current_action, xp, level, selected_title')
    .eq('id', user.id)
    .maybeSingle()

  return Response.json({ status: data })
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Perfil no disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const status_text = body.status_text != null ? String(body.status_text).trim().slice(0, 120) : null
  const current_action = body.current_action as string

  if (status_text) {
    const mod = moderateUserText(status_text, { minLength: 0, maxLength: 120 })
    if (mod.ok === false) return Response.json({ error: mod.reason }, { status: 400 })
  }

  if (current_action && !VALID_ACTIONS.includes(current_action as typeof VALID_ACTIONS[number])) {
    return Response.json({ error: 'Acción no válida' }, { status: 400 })
  }

  const supabase = await createClient()
  const patch: Record<string, string | null> = {}
  if (status_text !== undefined) patch.status_text = status_text || null
  if (current_action) patch.current_action = current_action

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
