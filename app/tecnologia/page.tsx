import ProductGrid from '../../components/ProductGrid'
import NewsFeed from '../../components/NewsFeed'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import AffiliateDisclosure from '../../components/AffiliateDisclosure'
import { NEWS_COPY, SECTION_COPY } from '../../lib/copy'
import { fetchNews } from '../../lib/rss'
import { isShopEnabled } from '../../lib/shop-config'
import { TECH_PRODUCTOS } from '../../lib/productos'

export const revalidate = 7200

export default async function TecnologiaPage() {
  const news = await fetchNews('tech', 8)
  const shop = isShopEnabled()

  return (
    <div className="section-tech space-y-10">
      <PageHeader
        variant="tech"
        eyebrow="Equipo"
        title="Tecnología"
        description={SECTION_COPY.techDesc}
      />

      <NewsFeed
        title={NEWS_COPY.techTitle}
        category="tech"
        items={news}
        emptyMessage={NEWS_COPY.techEmpty}
      />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_TECH || ''} className="ad-placeholder" />

      {shop ? (
        <>
          <ProductGrid title="Equipo recomendado" productos={TECH_PRODUCTOS} />
          <AffiliateDisclosure compact />
        </>
      ) : null}
    </div>
  )
}
