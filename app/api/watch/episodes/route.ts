import { NextRequest } from 'next/server'
import { getEpisodes, isConsumetEnabled } from '../../../../lib/watch/consumet'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  if (!isConsumetEnabled()) {
    return Response.json({ enabled: false, episodes: [] })
  }

  const url = new URL(req.url)
  const malId = url.searchParams.get('malId')
  const dub = url.searchParams.get('dub') === 'true'
  const provider = url.searchParams.get('provider') || undefined

  if (!malId) return Response.json({ error: 'malId requerido' }, { status: 400 })

  const episodes = await getEpisodes(malId, { dub, provider })
  return Response.json({ enabled: true, episodes: episodes || [] })
}
