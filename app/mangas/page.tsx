import MangaCard from '../../components/MangaCard'
import ProductGrid from '../../components/ProductGrid'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import AffiliateDisclosure from '../../components/AffiliateDisclosure'
import { fetchJikan, getBestImageUrl, mapMangaList } from '../../lib/jikan'
import { MANGA_PRODUCTOS, enrichProductosConMal } from '../../lib/productos'

export const revalidate = 21600

export default async function MangasPage() {
  const [data, productos] = await Promise.all([
    fetchJikan('/top/manga?limit=18'),
    enrichProductosConMal(MANGA_PRODUCTOS),
  ])
  const items = mapMangaList(data)
  const heroImages = items.map((m) => getBestImageUrl(m.images))

  return (
    <div className="section-manga space-y-10">
      <PageHeader variant="manga" images={heroImages} eyebrow="Manga" title="Mangas" />

      <AffiliateDisclosure />

      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow mb-1" style={{ color: '#FB923C' }}>Ranking</p>
            <h2 className="font-display text-xl font-bold text-text">Top mangas</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {items.map((m) => (
            <MangaCard
              key={m.mal_id}
              mal_id={m.mal_id}
              title={m.title}
              image={getBestImageUrl(m.images)}
              score={m.score}
              chapters={m.chapters}
            />
          ))}
        </div>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_MANGA || ''} className="ad-placeholder" />

      <ProductGrid title="Tomos para comprar" productos={productos} variant="manga" columns="3" />
    </div>
  )
}
