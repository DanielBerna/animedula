import { fetchJikan, fetchTopAnime, fetchTopManga, mapJikanList, type JikanAnime, type JikanManga } from '../jikan'
import { dedupeByKey, pickRotated } from '../rotate'
import { formatSeasonYear, getCurrentSeasonInfo } from '../seasons'

export type HomeFeatured = {
  seasonLabel: string
  seasonKey: string
  trending: JikanAnime[]
  upcoming: JikanAnime[]
  mangas: JikanManga[]
}

export async function fetchHomeFeatured(): Promise<HomeFeatured> {
  const { year, season } = getCurrentSeasonInfo()
  const seasonKey = `${year}-${season}`
  const seasonLabel = formatSeasonYear(season, year)

  const [seasonRes, topAnime, topManga, upcomingRes] = await Promise.all([
    fetchJikan(`/seasons/${year}/${season}?limit=24`),
    fetchTopAnime(20),
    fetchTopManga(12),
    fetchJikan('/seasons/upcoming?limit=12'),
  ])

  const seasonAnime = mapJikanList(seasonRes)
  const pool = dedupeByKey([...seasonAnime, ...topAnime], (a) => a.mal_id)
  const upcoming = dedupeByKey(mapJikanList(upcomingRes), (a) => a.mal_id)

  return {
    seasonLabel,
    seasonKey,
    trending: pickRotated(pool, 6, `${seasonKey}-trending`),
    upcoming: pickRotated(upcoming, 4, `${seasonKey}-upcoming`),
    mangas: pickRotated(topManga, 4, `${seasonKey}-manga`),
  }
}
