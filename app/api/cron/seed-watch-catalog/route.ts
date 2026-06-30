import { NextRequest } from 'next/server'
import { authorizeCron } from '../../../../lib/security/cron'
import { seedWatchCatalog } from '../../../../lib/watch/catalog-seed'

/** Registra anime popular/en emisión en watch_media (sin URLs aún). */
export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await seedWatchCatalog()
  return Response.json(result)
}
