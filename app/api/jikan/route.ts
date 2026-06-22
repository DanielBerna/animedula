import { NextRequest } from 'next/server'
import { checkRateLimit } from '../../../lib/ratelimit'
import { isAllowedJikanPath } from '../../../lib/security/proxy'
import { getClientIp } from '../../../lib/security/api'

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = await checkRateLimit(`proxy:jikan:${ip}`, 'proxy')
  if (!limit.success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const url = new URL(req.url)
  const rawPath = url.searchParams.get('path') || '/top/anime'

  if (!isAllowedJikanPath(rawPath)) {
    return Response.json({ error: 'Ruta no permitida' }, { status: 400 })
  }

  const [basePath, embeddedQuery] = rawPath.split('?')
  const forwardParams = new URLSearchParams()
  if (embeddedQuery) {
    new URLSearchParams(embeddedQuery).forEach((v, k) => forwardParams.set(k, v))
  }
  url.searchParams.forEach((v, k) => {
    if (k !== 'path') forwardParams.set(k, v)
  })

  const qs = forwardParams.toString()
  const target = `https://api.jikan.moe/v4${basePath}${qs ? `?${qs}` : ''}`

  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent': 'Animedula/1.0 (curacion-anime-mx)',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    })
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    })
  } catch {
    return Response.json({ error: 'upstream_error' }, { status: 502 })
  }
}
