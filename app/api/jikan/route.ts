import { NextRequest } from 'next/server'
import { checkRateLimit } from '../../../lib/ratelimit'

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anon'
  const limit = await checkRateLimit(ip)
  if (!limit.success) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const rawPath = url.searchParams.get('path') || '/top/anime'

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
    return new Response(JSON.stringify({ error: 'upstream_error' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }
}
