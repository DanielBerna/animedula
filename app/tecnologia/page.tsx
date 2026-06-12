import TechCard from '../../components/TechCard'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import AffiliateDisclosure from '../../components/AffiliateDisclosure'
import { TECH_PRODUCTS } from '../../lib/tecnologia'

export default function TecnologiaPage() {
  return (
    <div className="section-tech">
      <PageHeader variant="tech" eyebrow="Equipo" title="Tecnología" />

      <AffiliateDisclosure />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_TECH || ''} className="ad-placeholder my-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TECH_PRODUCTS.map((p) => (
          <TechCard
            key={p.nombre}
            nombre={p.nombre}
            descripcion={p.descripcion}
            query={p.query}
            icon={p.icon}
            badge={p.badge}
          />
        ))}
      </div>
    </div>
  )
}
