import { NextRequest } from 'next/server'
import { getSupabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return new Response(JSON.stringify({ error: 'Supabase no configurado aún' }), { status: 503 })
    }

    const { mal_id } = await req.json()
    if (!mal_id) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400 })

    const { error } = await getSupabaseAdmin().from('anime_cache').update({ estado: 'publicado' }).eq('mal_id', mal_id)
    if (error) throw error
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'unknown' }), { status: 500 })
  }
}
