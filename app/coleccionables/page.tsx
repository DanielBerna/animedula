import CollectibleCard from '../../components/CollectibleCard'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import AffiliateDisclosure from '../../components/AffiliateDisclosure'
import { COLECCIONABLES } from '../../lib/coleccionables'

export default function ColeccionablesPage() {
  const figuras = COLECCIONABLES.filter((c) => c.tipo === 'figura')
  const otros = COLECCIONABLES.filter((c) => c.tipo !== 'figura')

  return (
    <div className="section-collect">
      <PageHeader variant="collect" eyebrow="Tienda" title="Coleccionables" />

      <AffiliateDisclosure />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_COLLECT || ''} className="ad-placeholder my-6" />

      <section className="mb-10">
        <div className="section-head">
          <h2 className="font-display text-lg font-bold text-text">Figuras</h2>
          <span className="tag tag-gold">{figuras.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {figuras.map((c) => (
            <CollectibleCard key={c.nombre} {...c} />
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2 className="font-display text-lg font-bold text-text">Más coleccionables</h2>
          <span className="tag tag-gold">{otros.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {otros.map((c) => (
            <CollectibleCard key={c.nombre} {...c} />
          ))}
        </div>
      </section>
    </div>
  )
}
