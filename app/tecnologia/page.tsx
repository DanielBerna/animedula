import ProductGrid from '../../components/ProductGrid'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import AffiliateDisclosure from '../../components/AffiliateDisclosure'
import { TECH_PRODUCTOS } from '../../lib/productos'

export default function TecnologiaPage() {
  return (
    <div className="section-tech space-y-8">
      <PageHeader variant="tech" eyebrow="Equipo" title="Tecnología" />

      <AffiliateDisclosure />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_TECH || ''} className="ad-placeholder" />

      <ProductGrid title="Equipo recomendado" productos={TECH_PRODUCTOS} />
    </div>
  )
}
