import { NextRequest } from 'next/server'
import { generateEditorialReview } from '../../../lib/editorial'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const raw = body?.raw || {}
    const kind = raw.kind === 'manga' ? 'manga' : 'anime'

    const review = await generateEditorialReview({
      kind,
      id: raw.mal_id || raw.id || '0',
      title: raw.title || 'sin título',
      synopsis: raw.synopsis,
      score: raw.score,
      genres: raw.genres,
      status: raw.status,
      chapters: raw.chapters,
    })

    const draft = {
      mal_id: raw.mal_id || raw.id,
      title: raw.title,
      kind,
      estado: 'borrador',
      resumen: review.por_que,
      review,
    }

    return new Response(JSON.stringify({ ok: true, draft }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unknown' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
