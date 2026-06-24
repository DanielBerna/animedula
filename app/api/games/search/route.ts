import { NextRequest } from 'next/server'
import { fetchFreeGames } from '../../../../lib/games'
import { requireRateLimit } from '../../../../lib/security/api'

export async function GET(req: NextRequest) {
  const limited = await requireRateLimit(req, 'proxy', 'games-search')
  if (limited) return limited

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim().toLowerCase()
  const limit = Math.min(Number(url.searchParams.get('limit') || 10), 20)

  if (q.length < 2) {
    return Response.json({ results: [] })
  }

  const all = await fetchFreeGames()
  const results = all
    .filter((g) => g.title.toLowerCase().includes(q))
    .slice(0, limit)
    .map((g) => ({
      id: String(g.id),
      title: g.title,
      image_url: g.thumbnail || null,
    }))

  return Response.json({ results })
}
