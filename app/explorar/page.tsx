import React from 'react'
import AnimeCard from '../../components/AnimeCard'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import { fetchTopAnime, getBestImageUrl } from '../../lib/jikan'

export const revalidate = 3600

export default async function ExplorarPage() {
  const items = await fetchTopAnime(18)
  const heroImages = items.map((a) => getBestImageUrl(a.images))

  return (
    <div className="section-anime space-y-8">
      <PageHeader variant="anime" images={heroImages} eyebrow="Anime" title="Explorar" />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_EXPLORE_TOP || ''} className="ad-placeholder" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
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
