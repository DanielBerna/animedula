import { NextRequest } from 'next/server'
import { batchGenerateReviews, type BatchReviewTarget } from '../../../../lib/editorial/batch'

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return process.env.NODE_ENV === 'development'
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${secret}`
}

async function fetchTopAnime(limit: number): Promise<BatchReviewTarget[]> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const res = await fetch(`${site}/api/jikan?path=/top/anime&limit=${limit}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const json = await res.json()
  const items = json.data || []
  return items.map((it: Record<string, unknown>) => ({
    kind: 'anime' as const,
    mal_id: Number(it.mal_id),
    title: String(it.title || ''),
    synopsis: typeof it.synopsis === 'string' ? it.synopsis : undefined,
    score: typeof it.score === 'number' ? it.score : undefined,
    genres: Array.isArray(it.genres)
      ? it.genres.map((g: { name?: string }) => g.name).filter(Boolean)
      : undefined,
    status: typeof it.status === 'string' ? it.status : undefined,
  }))
}

async function fetchTopManga(limit: number): Promise<BatchReviewTarget[]> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const res = await fetch(`${site}/api/jikan?path=/top/manga&limit=${limit}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const json = await res.json()
  const items = json.data || []
  return items.map((it: Record<string, unknown>) => ({
    kind: 'manga' as const,
    mal_id: Number(it.mal_id),
    title: String(it.title || ''),
    synopsis: typeof it.synopsis === 'string' ? it.synopsis : undefined,
    score: typeof it.score === 'number' ? it.score : undefined,
    genres: Array.isArray(it.genres)
      ? it.genres.map((g: { name?: string }) => g.name).filter(Boolean)
      : undefined,
    status: typeof it.status === 'string' ? it.status : undefined,
    chapters: typeof it.chapters === 'number' ? it.chapters : undefined,
  }))
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const animeLimit = Math.min(Number(body.animeLimit) || 10, 20)
    const mangaLimit = Math.min(Number(body.mangaLimit) || 5, 15)

    const [anime, manga] = await Promise.all([
      fetchTopAnime(animeLimit),
      fetchTopManga(mangaLimit),
    ])

    const targets = [...anime, ...manga].filter((t) => t.mal_id && t.title)
    const results = await batchGenerateReviews(targets)

    const summary = {
      total: results.length,
      generated: results.filter((r) => r.status === 'generated').length,
      cached: results.filter((r) => r.status === 'skipped_cached').length,
      published: results.filter((r) => r.status === 'skipped_published').length,
      errors: results.filter((r) => r.status === 'error').length,
    }

    return new Response(JSON.stringify({ ok: true, summary, results }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }
}
