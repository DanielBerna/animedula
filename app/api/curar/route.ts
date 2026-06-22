import { NextRequest } from 'next/server'
import { authorizeCron } from '../../../lib/security/cron'
import { requireRateLimit } from '../../../lib/security/api'
import { generateEditorialReview } from '../../../lib/editorial'
import { requireEditor } from '../../../lib/auth'

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'strict', 'curar')
  if (limited) return limited

  const editor = await requireEditor()
  const cronOk = authorizeCron(req)
  if (!editor && !cronOk) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const raw = body?.raw || {}
    const kind = raw.kind === 'manga' ? 'manga' : 'anime'

    const review = await generateEditorialReview({
      kind,
      id: raw.mal_id || raw.id || '0',
      title: String(raw.title || 'sin título').slice(0, 200),
      synopsis: typeof raw.synopsis === 'string' ? raw.synopsis.slice(0, 2000) : undefined,
      score: typeof raw.score === 'number' ? raw.score : undefined,
      genres: Array.isArray(raw.genres) ? raw.genres.map(String).slice(0, 10) : undefined,
      status: typeof raw.status === 'string' ? raw.status.slice(0, 40) : undefined,
      chapters: typeof raw.chapters === 'number' ? raw.chapters : undefined,
    })

    const draft = {
      mal_id: raw.mal_id || raw.id,
      title: raw.title,
      kind,
      estado: 'borrador',
      resumen: review.por_que,
      review,
    }

    return Response.json({ ok: true, draft })
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
