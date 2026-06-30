import { NextRequest } from 'next/server'
import { getEpisodeMirrors } from '../../../../lib/watch/mirrors'
import { buildEmbedPlaybackSources } from '../../../../lib/watch/sources'
import { resolveAnilistId, resolveKitsuId } from '../../../../lib/watch/resolve-ids'
import type { WatchLang } from '../../../../lib/watch/types'
import { requireRateLimit } from '../../../../lib/security/api'

export const revalidate = 120

function parseLang(raw: string | null): WatchLang {
  if (raw === 'sub' || raw === 'dub' || raw === 'lat') return raw
  return 'sub'
}

export async function GET(req: NextRequest) {
  const limited = await requireRateLimit(req, 'proxy', 'watch-mirrors')
  if (limited) return limited

  const url = new URL(req.url)
  const malIdRaw = url.searchParams.get('malId')
  const episodeRaw = url.searchParams.get('ep')
  const lang = parseLang(url.searchParams.get('lang'))
  let anilistId = url.searchParams.get('anilistId')

  if (!malIdRaw || !episodeRaw) {
    return Response.json({ error: 'malId y ep requeridos' }, { status: 400 })
  }

  const malId = Number(malIdRaw)
  const episode = Math.max(1, Number(episodeRaw) || 1)
  if (!Number.isFinite(malId) || malId <= 0) {
    return Response.json({ error: 'malId inválido' }, { status: 400 })
  }

  let anilistNum = anilistId ? Number(anilistId) : null
  if (!anilistNum || !Number.isFinite(anilistNum)) {
    anilistNum = await resolveAnilistId(malId)
  }
  const kitsuNum = await resolveKitsuId(malId)

  const { mirrors, media, resolvedBy, langsAvailable } = await getEpisodeMirrors({
    malId,
    anilistId: anilistNum,
    episode,
    lang,
  })

  const embeds = buildEmbedPlaybackSources({
    malId,
    anilistId: anilistNum,
    kitsuId: kitsuNum,
    episode,
    lang,
    siteOrigin: url.origin,
  })

  const subtitleUrl =
    lang === 'sub' || lang === 'lat'
      ? `${url.origin}/api/watch/subtitles?malId=${malId}&ep=${episode}`
      : null

  return Response.json({
    lang,
    episode,
    malId,
    anilistId: anilistNum,
    kitsuId: kitsuNum,
    resolvedBy,
    mediaTitle: media?.title || null,
    mirrors,
    embeds,
    langsAvailable,
    hasLatino: langsAvailable.includes('lat'),
    subtitleUrl,
    subtitlesConfigured: Boolean(process.env.OPENSUBTITLES_API_KEY?.trim()),
  })
}
