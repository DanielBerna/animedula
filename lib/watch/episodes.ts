import { fetchJikan } from '../jikan'

export type WatchEpisodeMeta = {
  number: number
  title: string | null
  aired: string | null
  filler: boolean
  recap: boolean
}

export type WatchEpisodeCatalog = {
  malId: number
  status: string | null
  totalEpisodes: number | null
  airedEpisodes: number
  episodes: WatchEpisodeMeta[]
  maxEpisode: number
  isAiring: boolean
}

type JikanEpisodeRow = {
  title?: string
  aired?: string
  filler?: boolean
  recap?: boolean
}

async function fetchEpisodePage(malId: number, page: number): Promise<{
  rows: JikanEpisodeRow[]
  hasNext: boolean
}> {
  const data = await fetchJikan(`/anime/${malId}/episodes?page=${page}`, 3600)
  const rows = (data?.data || []) as JikanEpisodeRow[]
  const pagination = data?.pagination as { has_next_page?: boolean } | undefined
  return { rows, hasNext: Boolean(pagination?.has_next_page) }
}

export async function fetchAnimeEpisodeCatalog(malId: number): Promise<WatchEpisodeCatalog> {
  const detail = await fetchJikan(`/anime/${malId}`, 3600)
  const anime = detail?.data
  const status = (anime?.status as string) || null
  const malTotal = typeof anime?.episodes === 'number' && anime.episodes > 0 ? anime.episodes : null
  const isAiring = status?.toLowerCase().includes('airing') ?? false

  const episodes: WatchEpisodeMeta[] = []
  let page = 1
  let hasNext = true

  while (hasNext && page <= 30) {
    const batch = await fetchEpisodePage(malId, page)
    for (const row of batch.rows) {
      episodes.push({
        number: episodes.length + 1,
        title: row.title?.trim() || null,
        aired: row.aired || null,
        filler: Boolean(row.filler),
        recap: Boolean(row.recap),
      })
    }
    hasNext = batch.hasNext && batch.rows.length > 0
    page += 1
  }

  const airedEpisodes = episodes.length
  let maxEpisode = malTotal ?? airedEpisodes
  if (maxEpisode < 1 && airedEpisodes > 0) maxEpisode = airedEpisodes
  if (maxEpisode < 1) maxEpisode = 1

  if (!malTotal && isAiring && airedEpisodes > 0) {
    maxEpisode = airedEpisodes
  }

  return {
    malId,
    status,
    totalEpisodes: malTotal,
    airedEpisodes,
    episodes,
    maxEpisode,
    isAiring,
  }
}
