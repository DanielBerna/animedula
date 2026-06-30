import { NextRequest } from 'next/server'
import { authorizeCron } from '../../../../lib/security/cron'
import { fetchAndImportWatchFeed } from '../../../../lib/watch/import'
import { logIngestRun } from '../../../../lib/watch/catalog-seed'

/** Sincroniza espejos desde un JSON remoto (WATCH_MIRROR_FEED_URL). */
export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const feedUrl = process.env.WATCH_MIRROR_FEED_URL?.trim()
  if (!feedUrl) {
    return Response.json({ skipped: true, reason: 'WATCH_MIRROR_FEED_URL no configurada' })
  }

  const result = await fetchAndImportWatchFeed(feedUrl)
  await logIngestRun('sync-feed', {
    shows_registered: result.showsRegistered,
    sources_added: result.sourcesAdded,
    sources_skipped: result.sourcesSkipped,
    errors: result.errors,
  })
  return Response.json(result)
}
