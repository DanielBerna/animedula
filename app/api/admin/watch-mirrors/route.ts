import { NextRequest } from 'next/server'
import { requireEditor } from '../../../../lib/auth'
import {
  deleteEpisodeSource,
  listEpisodeSourcesForAdmin,
  listWatchMedia,
  upsertEpisodeSource,
  upsertWatchMedia,
} from '../../../../lib/watch/mirrors'
import { listCatalogGaps, listPendingSubmissions, reviewSubmission } from '../../../../lib/watch/pipeline'
import { seedWatchCatalog } from '../../../../lib/watch/catalog-seed'
import { requireRateLimit } from '../../../../lib/security/api'
import type { WatchLang } from '../../../../lib/watch/types'

export async function GET(req: NextRequest) {
  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

  const url = new URL(req.url)
  const mediaId = url.searchParams.get('mediaId')
  const episode = url.searchParams.get('episode')
  const gaps = url.searchParams.get('gaps') === 'true'
  const pending = url.searchParams.get('pending') === 'true'

  if (pending) {
    const submissions = await listPendingSubmissions()
    return Response.json({ submissions })
  }

  if (gaps) {
    const catalogGaps = await listCatalogGaps()
    return Response.json({ gaps: catalogGaps })
  }

  if (mediaId && episode) {
    const sources = await listEpisodeSourcesForAdmin(Number(mediaId), Math.max(1, Number(episode) || 1))
    return Response.json({ sources })
  }

  const media = await listWatchMedia()
  return Response.json({ media })
}

export async function POST(req: NextRequest) {
  const editor = await requireEditor()
  if (!editor) return Response.json({ error: 'No autorizado' }, { status: 403 })

  const limited = await requireRateLimit(req, 'mutation', 'admin-watch-mirrors')
  if (limited) return limited

  const body = await req.json()
  const action = body.action as string

  if (action === 'upsert_media') {
    const result = await upsertWatchMedia({
      id: body.id,
      mal_id: body.mal_id != null ? Number(body.mal_id) : null,
      anilist_id: body.anilist_id != null ? Number(body.anilist_id) : null,
      title: String(body.title || ''),
      slug: body.slug,
      notes: body.notes,
    })
    if (result.error) return Response.json({ error: result.error }, { status: 400 })
    return Response.json({ media: result.media })
  }

  if (action === 'upsert_source') {
    const lang = body.lang as WatchLang
    if (!['lat', 'sub', 'dub'].includes(lang)) {
      return Response.json({ error: 'lang inválido' }, { status: 400 })
    }
    const result = await upsertEpisodeSource({
      id: body.id,
      media_id: Number(body.media_id),
      episode: Math.max(1, Number(body.episode) || 1),
      lang,
      source_type: body.source_type,
      server_label: String(body.server_label || ''),
      url: String(body.url || ''),
      referer: body.referer,
      quality: body.quality,
      sort_order: body.sort_order != null ? Number(body.sort_order) : 0,
    })
    if (result.error) return Response.json({ error: result.error }, { status: 400 })
    return Response.json({ source: result.source })
  }

  if (action === 'delete_source') {
    const result = await deleteEpisodeSource(Number(body.id))
    if (result.error) return Response.json({ error: result.error }, { status: 400 })
    return Response.json({ ok: true })
  }

  if (action === 'import_batch') {
    const { importWatchMirrors } = await import('../../../../lib/watch/import')
    const result = await importWatchMirrors(body.payload ?? body)
    return Response.json(result)
  }

  if (action === 'seed_catalog') {
    const result = await seedWatchCatalog()
    return Response.json(result)
  }

  if (action === 'review_submission') {
    const id = Number(body.id)
    const decision = body.decision === 'reject' ? 'reject' : 'approve'
    const result = await reviewSubmission(id, decision, editor.id)
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 })
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'action desconocida' }, { status: 400 })
}
