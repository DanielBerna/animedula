import { NextRequest } from 'next/server'
import { requireAdmin } from '../../../../lib/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin'
import { requireRateLimit } from '../../../../lib/security/api'

const ROLES = ['user', 'contributor', 'editor', 'admin'] as const

export async function GET(req: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return Response.json({ error: 'Solo administradores' }, { status: 403 })
  if (!isSupabaseConfigured()) return Response.json({ users: [] })

  const q = new URL(req.url).searchParams.get('q')?.trim().toLowerCase() || ''
  const db = getSupabaseAdmin()

  let query = db
    .from('profiles')
    .select('id, username, display_name, role, level, xp, coins, is_premium, created_at')
    .order('created_at', { ascending: false })
    .limit(80)

  if (q) {
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ users: data || [] })
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'admin-users')
  if (limited) return limited

  const adminUser = await requireAdmin()
  if (!adminUser) return Response.json({ error: 'Solo administradores' }, { status: 403 })
  if (!isSupabaseConfigured()) return Response.json({ error: 'No disponible' }, { status: 503 })

  const body = await req.json()
  const userId = String(body.user_id || '')
  const role = String(body.role || '')
  const is_premium = body.is_premium

  if (!userId) return Response.json({ error: 'Falta user_id' }, { status: 400 })
  if (userId === adminUser.id && role && role !== 'admin') {
    return Response.json({ error: 'No puedes quitarte el rol admin a ti mismo' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (role && ROLES.includes(role as typeof ROLES[number])) patch.role = role
  if (typeof is_premium === 'boolean') {
    patch.is_premium = is_premium
    if (is_premium) patch.premium_plan = body.premium_plan || 'animedula-plus'
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { error } = await db.from('profiles').update(patch).eq('id', userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
