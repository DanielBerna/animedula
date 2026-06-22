import { NextRequest } from 'next/server'
import { authorizeCron } from '../../../../lib/security/cron'

export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const secret = process.env.CRON_SECRET?.trim()
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${site}/api/jikan?path=/top/anime&limit=10`)
    if (!res.ok) throw new Error('failed to fetch jikan')
    const json = await res.json()
    const items = json.data || []

    const results: { mal_id: number; status: number; body: unknown }[] = []
    for (const it of items) {
      const payload = {
        raw: {
          mal_id: it.mal_id,
          title: it.title,
          synopsis: it.synopsis || it.title,
          score: it.score,
        },
      }
      const r = await fetch(`${site}/api/curar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const jr = await r.json().catch(() => ({ error: 'invalid_json' }))
      results.push({ mal_id: it.mal_id, status: r.status, body: jr })
    }

    return Response.json({ results })
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
