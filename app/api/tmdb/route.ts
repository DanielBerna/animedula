import { NextRequest } from 'next/server'
import { checkRateLimit } from '../../../lib/ratelimit'
import { isAllowedTmdbPath } from '../../../lib/security/proxy'
import { getClientIp } from '../../../lib/security/api'

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = await checkRateLimit(`proxy:tmdb:${ip}`, 'proxy')
  if (!limit.success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const url = new URL(req.url)
  const path = url.searchParams.get('path') || '/trending/movie/day'

  if (!isAllowedTmdbPath(path)) {
    return Response.json({ error: 'Ruta no permitida' }, { status: 400 })
  }

  const apiKey = process.env.TMDB_API_KEY || ''
  if (!apiKey) {
    return Response.json({ error: 'TMDB no configurado' }, { status: 503 })
  }

  const forwardParams = new URLSearchParams()
  url.searchParams.forEach((v, k) => {
    if (k !== 'path') forwardParams.set(k, v)
  })
  forwardParams.set('api_key', apiKey)

  const qs = forwardParams.toString()
  const target = `https://api.themoviedb.org/3${path}?${qs}`

  try {
    const res = await fetch(target)
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    })
  } catch {
    return Response.json({ error: 'upstream_error' }, { status: 502 })
  }
}
