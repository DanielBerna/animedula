import AnimeCard from '../../components/AnimeCard'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import { fetchJikan, getBestImageUrl, mapJikanList } from '../../lib/jikan'
import Link from 'next/link'

export const revalidate = 21600

export default async function AnimeListPage() {
  const data = await fetchJikan('/seasons/now?limit=12')
  const items = mapJikanList(data)
  const heroImages = items.map((a) => getBestImageUrl(a.images))

  return (
    <div className="section-anime space-y-8">
      <PageHeader variant="anime" images={heroImages} eyebrow="Temporada" title="En emisión">
        <Link href="/calendario" className="section-link hero-link">Ver calendario →</Link>
      </PageHeader>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_ANIME_TOP || ''} className="ad-placeholder" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
        {items.map((anime, i) => (
          <AnimeCard
            key={anime.mal_id}
            slug={String(anime.mal_id)}
            title={anime.title}
            image={getBestImageUrl(anime.images)}
            score={anime.score}
            rank={i + 1}
          />
        ))}
      </div>
    </div>
  )
}
