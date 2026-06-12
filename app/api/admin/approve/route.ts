import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../lib/auth'
import { getEditorialReview } from '../../../../lib/editorial'
import { publishReview, upsertPublishedReview } from '../../../../lib/editorial/db'
import { isSupabaseAuthConfigured } from '../../../../lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return Response.json({ error: 'Supabase no configurado' }, { status: 503 })
    }

    const editor = await requireEditor()
    if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const body = await req.json()
    const { review_id, kind, mal_id, title } = body

    if (review_id) {
      await publishReview(review_id, editor.id)
      return Response.json({ ok: true, review_id })
    }

    if (kind && mal_id) {
      const review = await getEditorialReview({
        kind,
        id: mal_id,
        title: title || `${kind} ${mal_id}`,
      })
      const id = await upsertPublishedReview(kind, Number(mal_id), review, editor.id, 'human')
      return Response.json({ ok: true, review_id: id })
    }

    return Response.json({ error: 'Faltan review_id o kind+mal_id' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown'
    return Response.json({ error: message }, { status: 500 })
  }
}
