import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../lib/auth'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'
import { requireRateLimit } from '../../../lib/security/api'

const FIELDS = ['gancho', 'por_que', 'para_quien', 'no_para', 'contexto_practico', 'veredicto'] as const

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'submissions')
  if (limited) return limited

  if (!isSupabaseAuthConfigured()) {
    return Response.json({ error: 'Aportes no disponibles aún' }, { status: 503 })
  }

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión para aportar' }, { status: 401 })

  const { kind, mal_id, field, body } = await req.json()
  if (!kind || !mal_id || !field || !body?.trim()) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  if (!FIELDS.includes(field)) {
    return Response.json({ error: 'Campo no válido' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('community_submissions')
    .insert({
      kind,
      mal_id: Number(mal_id),
      user_id: user.id,
      field,
      body: String(body).trim().slice(0, 1500),
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, id: data?.id })
}
