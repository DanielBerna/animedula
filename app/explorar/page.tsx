import React from 'react'
import AnimeCard from '../../components/AnimeCard'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import { formatSeasonYear, getCurrentSeasonInfo } from '../../lib/seasons'
import { dedupeByKey, pickRotated } from '../../lib/rotate'
import { fetchJikan, fetchTopAnime, getBestImageUrl, mapJikanList } from '../../lib/jikan'

export const revalidate = 3600

export default async function ExplorarPage() {
  const { year, season } = getCurrentSeasonInfo()
  const seasonLabel = formatSeasonYear(season, year)

  const [seasonRes, top] = await Promise.all([
    fetchJikan(`/seasons/${year}/${season}?limit=30`),
    fetchTopAnime(24),
  ])

  const pool = dedupeByKey([...mapJikanList(seasonRes), ...top], (a) => a.mal_id)
  const items = pickRotated(pool, 18, `${year}-${season}-explore`)
  const heroImages = items.map((a) => getBestImageUrl(a.images))

  return (
    <div className="section-anime space-y-8">
      <PageHeader
        variant="anime"
        images={heroImages}
        eyebrow="Anime"
        title="Explorar"
        description={`Selección de ${seasonLabel} — rota cada día`}
      />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_EXPLORE_TOP || ''} className="ad-placeholder" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5 luxe-grid">
        {items.map((anime, i) => (
          <React.Fragment key={anime.mal_id}>
            {i === 6 && (
              <div className="col-span-full py-2">
                <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_EXPLORE_MID || ''} className="ad-placeholder" />
              </div>
            )}
            <AnimeCard
              slug={String(anime.mal_id)}
              title={anime.title}
              image={getBestImageUrl(anime.images)}
              score={anime.score}
              rank={i + 1}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
