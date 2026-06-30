import { NextRequest } from 'next/server'
import { getAuthUser } from '../../../../lib/auth'
import { createSubmission } from '../../../../lib/watch/pipeline'
import { requireRateLimit } from '../../../../lib/security/api'
import { moderateUserText } from '../../../../lib/security/content-moderation'

export async function POST(req: NextRequest) {
  const limited = await requireRateLimit(req, 'mutation', 'watch-submit')
  if (limited) return limited

  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Inicia sesión para aportar enlaces' }, { status: 401 })

  const body = await req.json()
  const malId = Number(body.mal_id)
  const episode = Math.max(1, Number(body.episode) || 1)
  const url = String(body.url || '').trim()

  if (!Number.isFinite(malId) || malId <= 0) {
    return Response.json({ error: 'mal_id inválido' }, { status: 400 })
  }
  if (!url.startsWith('http')) {
    return Response.json({ error: 'URL inválida' }, { status: 400 })
  }

  const notes = body.notes ? String(body.notes).slice(0, 500) : null
  if (notes) {
    const mod = moderateUserText(notes)
    if (mod.ok === false) {
      return Response.json({ error: mod.reason }, { status: 400 })
    }
  }

  const result = await createSubmission({
    mal_id: malId,
    episode,
    url,
    referer: body.referer,
    notes,
    submitted_by: user.id,
    lang: body.lang,
    source_type: body.source_type,
    server_label: body.server_label,
  })

  if (result.error) return Response.json({ error: result.error }, { status: 400 })
  return Response.json({ ok: true, submission: result.submission })
}
