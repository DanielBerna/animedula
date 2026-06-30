import { NextRequest } from 'next/server'
import { getSources, isConsumetEnabled } from '../../../../lib/watch/consumet'

export const revalidate = 600

export async function GET(req: NextRequest) {
  if (!isConsumetEnabled()) {
    return Response.json({ enabled: false, sources: [] })
  }

  const url = new URL(req.url)
  const episodeId = url.searchParams.get('episodeId')
  const provider = url.searchParams.get('provider') || undefined
  if (!episodeId) return Response.json({ error: 'episodeId requerido' }, { status: 400 })

  const result = await getSources(episodeId, { provider })
  if (!result) return Response.json({ enabled: true, sources: [] })

  return Response.json({ enabled: true, ...result })
}
