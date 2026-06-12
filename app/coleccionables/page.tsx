import CollectibleCard from '../../components/CollectibleCard'
import ProductGrid from '../../components/ProductGrid'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import AffiliateDisclosure from '../../components/AffiliateDisclosure'
import { COLECCIONABLES } from '../../lib/coleccionables'
import { COLECTIBLE_PRODUCTOS } from '../../lib/productos'

export default function ColeccionablesPage() {
  const figuras = COLECCIONABLES.filter((c) => c.tipo === 'figura')
  const otros = COLECCIONABLES.filter((c) => c.tipo !== 'figura')

  return (
    <div className="section-collect space-y-10">
      <PageHeader variant="collect" eyebrow="Tienda" title="Coleccionables" />

      <AffiliateDisclosure />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_COLLECT || ''} className="ad-placeholder" />

      <ProductGrid title="Productos destacados" productos={COLECTIBLE_PRODUCTOS} />

      <section>
        <div className="section-head">
          <h2 className="font-display text-lg font-bold text-text">Buscar por categoría</h2>
        </div>
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-muted mb-3">Figuras</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {figuras.map((c) => (
                <CollectibleCard key={c.nombre} {...c} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted mb-3">Más coleccionables</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otros.map((c) => (
                <CollectibleCard key={c.nombre} {...c} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
