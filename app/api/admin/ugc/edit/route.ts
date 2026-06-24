import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../../lib/auth'
import { updateUgcReview } from '../../../../../lib/social/ugc-moderation'
import { requireRateLimit } from '../../../../../lib/security/api'

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'admin-ugc-edit')
  if (limited) return limited

  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const reviewId = Number(body.review_id)
  if (!Number.isFinite(reviewId)) return Response.json({ error: 'ID inválido' }, { status: 400 })

  const comment = body.comment != null ? String(body.comment).trim().slice(0, 4000) : undefined
  const rating = body.rating_global != null ? Number(body.rating_global) : undefined
  const is_spoiler = body.is_spoiler != null ? Boolean(body.is_spoiler) : undefined

  if (rating != null && (rating < 1 || rating > 10)) {
    return Response.json({ error: 'Rating 1-10' }, { status: 400 })
  }

  try {
    await updateUgcReview(reviewId, {
      ...(comment !== undefined ? { comment } : {}),
      ...(rating !== undefined ? { rating_global: rating } : {}),
      ...(is_spoiler !== undefined ? { is_spoiler } : {}),
    })
    return Response.json({ ok: true })
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 500 },
    )
  }
}
