import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../lib/auth'
import { rejectReview } from '../../../../lib/editorial/db'
import { isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return Response.json({ error: 'Supabase no configurado' }, { status: 503 })
    }

    const editor = await requireEditor()
    if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { review_id } = await req.json()
    if (!review_id) return Response.json({ error: 'missing_review_id' }, { status: 400 })

    await rejectReview(review_id, editor.id)
    return Response.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown'
    return Response.json({ error: message }, { status: 500 })
  }
}
