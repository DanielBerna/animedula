import { NextRequest } from 'next/server'
import { resolveSpanishSubtitleVtt } from '../../../../lib/watch/subtitles-server'
import { requireRateLimit } from '../../../../lib/security/api'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const limited = await requireRateLimit(req, 'proxy', 'watch-subtitles')
  if (limited) return limited

  const malId = Number(req.nextUrl.searchParams.get('malId'))
  const episode = Math.max(1, Number(req.nextUrl.searchParams.get('ep')) || 1)

  if (!Number.isFinite(malId) || malId <= 0) {
    return new Response('malId inválido', { status: 400, headers: CORS })
  }

  const { vtt, source } = await resolveSpanishSubtitleVtt(malId, episode)

  if (!vtt) {
    const status = source === 'unconfigured' ? 503 : 404
    const msg =
      source === 'unconfigured'
        ? 'Subtítulos ES no configurados (OPENSUBTITLES_API_KEY)'
        : 'Sin subtítulos en español para este capítulo'
    return new Response(msg, { status, headers: CORS })
  }

  return new Response(vtt, {
    headers: {
      ...CORS,
      'Content-Type': 'text/vtt; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
