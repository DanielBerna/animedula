import AffiliateDisclosure from './AffiliateDisclosure'
import { buildGoUrl, getCuratedMerch } from '../lib/affiliates'

type Props = {
  animeTitle: string
  malId?: number
}

export default function MerchSection({ animeTitle, malId }: Props) {
  const items = getCuratedMerch(animeTitle)

  return (
    <section className="card-glass p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-text">Merch</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-white/6 bg-surface-3/40 p-4 flex flex-col justify-between hover:border-accent/30 hover:bg-surface-3/70 transition duration-300"
          >
            <div>
              {item.badge && <span className="tag tag-accent text-[10px] mb-2">{item.badge}</span>}
              <h4 className="font-display font-semibold text-text">{item.label}</h4>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{item.description}</p>
            </div>
            <a
              href={buildGoUrl(item.partner, { query: item.query, anime: animeTitle, malId })}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="mt-4 btn-primary text-sm text-center py-2.5 focus-ring"
            >
              {item.cta}
            </a>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <AffiliateDisclosure compact />
      </div>
    </section>
  )
}
