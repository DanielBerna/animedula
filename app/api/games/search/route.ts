import { NextRequest } from 'next/server'
import { searchGames } from '../../../../lib/games'
import { requireRateLimit } from '../../../../lib/security/api'

export async function GET(req: NextRequest) {
  const limited = await requireRateLimit(req, 'proxy', 'games-search')
  if (limited) return limited

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const limit = Math.min(Number(url.searchParams.get('limit') || 12), 20)

  if (q.length < 2) {
    return Response.json({ results: [] })
  }

  const results = await searchGames(q, limit)
  return Response.json({ results })
}
