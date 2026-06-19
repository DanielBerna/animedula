import StreamingCard from './StreamingCard'
import { crunchyrollSearch, netflixSearch, primeVideoSearch } from '../lib/shop-links'

type StreamingEntry = { name: string; url?: string }

type Props = {
  animeTitle: string
  malId?: number
  sources?: StreamingEntry[]
}

type StreamItem = {
  name: string
  price?: string
  href: string
  cta: string
}

function matchPlatform(name: string, animeTitle: string, fallbackUrl?: string): StreamItem {
  const key = name.toLowerCase()
  if (key.includes('crunchyroll')) {
    return { name, price: 'Suscripción', href: crunchyrollSearch(animeTitle), cta: 'Buscar en Crunchyroll' }
  }
  if (key.includes('netflix')) {
    return { name, price: 'Incluido en plan', href: netflixSearch(animeTitle), cta: 'Buscar en Netflix' }
  }
  if (key.includes('prime') || key.includes('amazon')) {
    return { name: 'Prime Video', price: 'Alquiler / Suscripción', href: primeVideoSearch(animeTitle), cta: 'Buscar en Prime Video' }
  }
  if (key.includes('hidive')) {
    return { name, price: 'Suscripción', href: `https://www.hidive.com/search?q=${encodeURIComponent(animeTitle)}`, cta: 'Buscar en HIDIVE' }
  }
  return {
    name,
    price: 'En streaming',
    href: fallbackUrl || `https://www.google.com/search?q=${encodeURIComponent(`${name} ${animeTitle}`)}`,
    cta: `Ir a ${name}`,
  }
}

export default function WhereToWatch({ animeTitle, sources }: Props) {
  const items: StreamItem[] =
    sources && sources.length > 0
      ? sources.map((s) => matchPlatform(s.name, animeTitle, s.url))
      : [
          { name: 'Crunchyroll', price: 'Suscripción', href: crunchyrollSearch(animeTitle), cta: 'Buscar en Crunchyroll' },
          { name: 'Prime Video', price: 'Alquiler / Suscripción', href: primeVideoSearch(animeTitle), cta: 'Buscar en Prime Video' },
          { name: 'Netflix', price: 'Incluido en plan', href: netflixSearch(animeTitle), cta: 'Buscar en Netflix' },
        ]

  return (
    <div className="card-glass p-5 md:p-6">
      <h3 className="font-display text-lg font-semibold text-text mb-5">Dónde verlo</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((s) => (
          <StreamingCard key={s.name} name={s.name} price={s.price} href={s.href} cta={s.cta} />
        ))}
      </div>
    </div>
  )
}
