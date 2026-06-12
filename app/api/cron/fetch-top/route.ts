import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${site}/api/jikan?path=/top/anime&limit=10`)
    if (!res.ok) throw new Error('failed to fetch jikan')
    const json = await res.json()
    const items = json.data || []

    const results: any[] = []
    for (const it of items) {
      const payload = { raw: { mal_id: it.mal_id, title: it.title, synopsis: it.synopsis || it.title, image: it.images?.jpg?.image_url, score: it.score } }
      const r = await fetch(`${site}/api/curar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const jr = await r.json().catch(() => ({ error: 'invalid_json' }))
      results.push({ mal_id: it.mal_id, status: r.status, body: jr })
    }

    return new Response(JSON.stringify({ results }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
