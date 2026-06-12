export default function AffiliateDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] text-faint leading-relaxed">
        Enlaces de afiliado — Animédula puede recibir comisión sin cambiar nuestro criterio.
      </p>
    )
  }

  return (
    <aside className="rounded-xl border border-white/6 bg-surface-2/80 px-5 py-4 text-sm text-muted leading-relaxed backdrop-blur-sm">
      <span className="tag tag-accent text-[10px] mb-2">Transparencia</span>
      <p className="mt-2">
        Algunos enlaces son de afiliado (Amazon, Mercado Libre, streaming).
        Si compras o te suscribes, Animédula puede recibir una comisión.
        Eso no influye en nuestras reseñas ni recomendaciones.
      </p>
    </aside>
  )
}
