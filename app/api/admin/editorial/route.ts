import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../lib/auth'
import {
  getEditorialReviewById,
  updateEditorialReview,
} from '../../../../lib/editorial/db'
import type { EditorialReview } from '../../../../lib/editorial/types'
import { requireRateLimit } from '../../../../lib/security/api'

export async function GET(req: NextRequest) {
  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'Falta id' }, { status: 400 })

  const row = await getEditorialReviewById(id)
  if (!row) return Response.json({ error: 'No encontrada' }, { status: 404 })
  return Response.json(row)
}

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'admin-editorial')
  if (limited) return limited

  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const reviewId = String(body.review_id || '')
  if (!reviewId) return Response.json({ error: 'Falta review_id' }, { status: 400 })

  const review = body.review as EditorialReview
  if (!review?.gancho || !review?.por_que) {
    return Response.json({ error: 'Campos incompletos' }, { status: 400 })
  }

  try {
    await updateEditorialReview(reviewId, review, editor.id, { publish: Boolean(body.publish) })
    return Response.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al guardar'
    return Response.json({ error: message }, { status: 500 })
  }
}
