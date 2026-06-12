import { NextRequest } from 'next/server'
import { checkRateLimit } from '../../../lib/ratelimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anon'
  const limit = await checkRateLimit(ip)
  if (!limit.success) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })

  try {
    const body = await req.json()
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.text()
    return new Response(json, { status: res.status, headers: { 'content-type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'upstream_error' }), { status: 502 })
  }
}
