import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../../lib/auth'
import { setUgcReviewStatus } from '../../../../../lib/social/ugc-moderation'
import { isSupabaseAuthConfigured } from '../../../../../lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseAuthConfigured()) {
      return Response.json({ error: 'Supabase no configurado' }, { status: 503 })
    }

    const editor = await requireEditor()
    if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

    const body = await req.json()
    const reviewId = Number(body.review_id)
    if (!Number.isFinite(reviewId)) {
      return Response.json({ error: 'review_id inválido' }, { status: 400 })
    }

    await setUgcReviewStatus(reviewId, 'published')
    return Response.json({ ok: true, review_id: reviewId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown'
    return Response.json({ error: message }, { status: 500 })
  }
}
