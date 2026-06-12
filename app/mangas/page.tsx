import MangaCard from '../../components/MangaCard'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import MexicoBadge from '../../components/MexicoBadge'
import AffiliateDisclosure from '../../components/AffiliateDisclosure'
import { fetchJikan, getBestImageUrl, mapMangaList } from '../../lib/jikan'

export const revalidate = 21600

export default async function MangasPage() {
  const data = await fetchJikan('/top/manga?limit=18')
  const items = mapMangaList(data)
  const heroImages = items.map((m) => getBestImageUrl(m.images))

  return (
    <div className="section-manga space-y-8">
      <PageHeader variant="manga" images={heroImages} eyebrow="Lectura" title="Mangas">
        <MexicoBadge />
      </PageHeader>

      <AffiliateDisclosure />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_MANGA || ''} className="ad-placeholder" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
        {items.length > 0 ? (
          items.map((m) => (
            <MangaCard
              key={m.mal_id}
              mal_id={m.mal_id}
              title={m.title}
              image={m.images?.jpg?.image_url}
              score={m.score}
              chapters={m.chapters}
            />
          ))
        ) : (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="manga-card">
              <div className="manga-cover animate-pulse bg-surface-4" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
