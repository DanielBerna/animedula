import AffiliateCard from './AffiliateCard'
import AffiliateDisclosure from './AffiliateDisclosure'

type StreamingEntry = { name: string; url?: string }

type Props = {
  animeTitle: string
  malId?: number
  sources?: StreamingEntry[]
}

const STREAMING_MAP: Record<string, { partner?: 'crunchyroll' | 'prime' | 'amazon'; cta: string; affiliate: boolean }> = {
  crunchyroll: { partner: 'crunchyroll', cta: 'Ver en Crunchyroll', affiliate: true },
  netflix: { cta: 'Ver en Netflix', affiliate: false },
  'amazon prime video': { partner: 'prime', cta: 'Ver en Prime Video', affiliate: true },
  'prime video': { partner: 'prime', cta: 'Ver en Prime Video', affiliate: true },
  hidive: { cta: 'Ver en HIDIVE', affiliate: false },
}

function matchPlatform(name: string) {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(STREAMING_MAP)) {
    if (key.includes(k)) return v
  }
  return { cta: `Ver en ${name}`, affiliate: false }
}

export default function WhereToWatch({ animeTitle, malId, sources }: Props) {
  const fromApi =
    sources?.map((s) => {
      const meta = matchPlatform(s.name)
      return {
        name: s.name,
        price: 'En streaming',
        partner: meta.partner,
        cta: meta.cta,
        affiliate: meta.affiliate,
        href: meta.affiliate ? undefined : s.url,
      }
    }) || []

  const items =
    fromApi.length > 0
      ? fromApi
      : [
          { name: 'Crunchyroll', price: 'Suscripción', partner: 'crunchyroll' as const, cta: 'Ver en Crunchyroll', affiliate: true },
          { name: 'Prime Video', price: 'Alquiler / Suscripción', partner: 'prime' as const, cta: 'Ver en Prime Video', affiliate: true },
          { name: 'Netflix', price: 'Incluido en plan', cta: 'Buscar en Netflix', affiliate: false, href: `https://www.netflix.com/search?q=${encodeURIComponent(animeTitle)}` },
        ]

  return (
    <div className="card-glass p-5 md:p-6">
      <h3 className="font-display text-lg font-semibold text-text mb-5">Dónde verlo</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((s, i) => (
          <AffiliateCard
            key={i}
            name={s.name}
            price={s.price}
            partner={s.partner}
            anime={animeTitle}
            malId={malId}
            href={s.href}
            cta={s.cta}
            affiliate={s.affiliate}
          />
        ))}
      </div>

      <div className="mt-4">
        <AffiliateDisclosure compact />
      </div>
    </div>
  )
}
