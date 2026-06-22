import { NextRequest } from 'next/server'
import { checkRateLimit } from '../../../lib/ratelimit'
import { isAllowedAnilistBody } from '../../../lib/security/proxy'
import { getClientIp } from '../../../lib/security/api'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = await checkRateLimit(`proxy:anilist:${ip}`, 'proxy')
  if (!limit.success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const body = await req.json()
    if (!isAllowedAnilistBody(body)) {
      return Response.json({ error: 'Query no permitida' }, { status: 400 })
    }

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.text()
    return new Response(json, { status: res.status, headers: { 'content-type': 'application/json' } })
  } catch {
    return Response.json({ error: 'upstream_error' }, { status: 502 })
  }
}
