import { NextRequest } from 'next/server'
import { publishDueEditorialReviews } from '../../../../lib/editorial/publish-scheduled'
import { authorizeCron } from '../../../../lib/security/cron'

export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await publishDueEditorialReviews()
    return Response.json({ ok: true, ...result })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
