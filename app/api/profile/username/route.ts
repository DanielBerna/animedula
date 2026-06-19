import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { isValidUsername } from '../../../../lib/profiles/public'
import { createClient, isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ username: null })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ username: null })

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('username, is_public, list_public')
    .eq('id', user.id)
    .maybeSingle()

  return Response.json({
    username: data?.username || null,
    is_public: data?.is_public ?? true,
    list_public: data?.list_public ?? true,
  })
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Perfil no disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const username = String(body.username || '').toLowerCase().trim()

  if (!isValidUsername(username)) {
    return Response.json(
      { error: 'Usuario inválido. Usa 3–24 caracteres: a-z, 0-9 o _' },
      { status: 400 },
    )
  }

  const reserved = ['admin', 'api', 'login', 'perfil', 'comunidad', 'noticias', 'u']
  if (reserved.includes(username)) {
    return Response.json({ error: 'Ese usuario está reservado' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'Ese usuario ya está en uso' }, { status: 409 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ username })
}

export async function PATCH(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Perfil no disponible' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión' }, { status: 401 })

  const body = await req.json()
  const patch: Record<string, boolean> = {}
  if (typeof body.is_public === 'boolean') patch.is_public = body.is_public
  if (typeof body.list_public === 'boolean') patch.list_public = body.list_public

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, ...patch })
}
