import { NextRequest } from 'next/server'
import { checkRateLimit } from '../../../lib/ratelimit'

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anon'
  const limit = await checkRateLimit(ip)
  if (!limit.success) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })

  const url = new URL(req.url)
  const path = url.searchParams.get('path') || '/trending/movie/day'
  const query = url.searchParams.toString()
  const apiKey = process.env.TMDB_API_KEY || ''
  const target = `https://api.themoviedb.org/3${path}${query ? `?${query}` : ''}${query ? `&` : `?`}api_key=${apiKey}`

  try {
    const res = await fetch(target)
    const body = await res.text()
    return new Response(body, { status: res.status, headers: { 'content-type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'upstream_error' }), { status: 502 })
  }
}
