import React from 'react'
import AnimeCard from '../../components/AnimeCard'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import MexicoBadge from '../../components/MexicoBadge'
import { fetchJikan, getBestImageUrl, mapJikanList } from '../../lib/jikan'

export const revalidate = 21600

export default async function ExplorarPage() {
  const data = await fetchJikan('/top/anime?limit=18')
  const items = mapJikanList(data)
  const heroImages = items.map((a) => getBestImageUrl(a.images))

  return (
    <div className="section-anime space-y-8">
      <PageHeader
        variant="anime"
        images={heroImages}
        eyebrow="Descubrimiento"
        title="Explorar anime"
      >
        <MexicoBadge />
      </PageHeader>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_EXPLORE_TOP || ''} className="ad-placeholder" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
        {items.length > 0 ? (
          items.map((anime, i) => (
            <React.Fragment key={anime.mal_id}>
              {i === 6 && (
                <div className="col-span-full py-2">
                  <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_EXPLORE_MID || ''} className="ad-placeholder" />
                </div>
              )}
              <AnimeCard
                slug={String(anime.mal_id)}
                title={anime.title}
                image={anime.images?.jpg?.image_url}
                score={anime.score}
                rank={i + 1}
              />
            </React.Fragment>
          ))
        ) : (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="poster-card">
              <div className="poster-img bg-surface-4 animate-pulse" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
