import { NextRequest } from 'next/server'
import { fetchAnimeEpisodeCatalog } from '../../../../lib/watch/episodes'
import { getMirrorCoverageForMal } from '../../../../lib/watch/coverage'
import { requireRateLimit } from '../../../../lib/security/api'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const limited = await requireRateLimit(req, 'proxy', 'watch-episodes')
  if (limited) return limited

  const malIdRaw = new URL(req.url).searchParams.get('malId')
  if (!malIdRaw) return Response.json({ error: 'malId requerido' }, { status: 400 })

  const malId = Number(malIdRaw)
  if (!Number.isFinite(malId) || malId <= 0) {
    return Response.json({ error: 'malId inválido' }, { status: 400 })
  }

  const [catalog, mirrors] = await Promise.all([
    fetchAnimeEpisodeCatalog(malId),
    getMirrorCoverageForMal(malId),
  ])

  const latSet = new Set(mirrors.latEpisodes)
  const coverageMap = new Map(mirrors.coverage.map((c) => [c.episode, c]))

  const episodeList =
    catalog.episodes.length > 0
      ? catalog.episodes.map((ep) => ({
          ...ep,
          hasLatino: latSet.has(ep.number),
          mirrorServers: coverageMap.get(ep.number)?.servers ?? [],
        }))
      : Array.from({ length: catalog.maxEpisode }, (_, i) => {
          const n = i + 1
          return {
            number: n,
            title: null as string | null,
            aired: null as string | null,
            filler: false,
            recap: false,
            hasLatino: latSet.has(n),
            mirrorServers: coverageMap.get(n)?.servers ?? [],
          }
        })

  return Response.json({
    ...catalog,
    episodes: episodeList,
    latEpisodes: mirrors.latEpisodes,
    mirrorCoverage: mirrors.coverage,
    embedProviders: mirrors.embedProviders,
  })
}
