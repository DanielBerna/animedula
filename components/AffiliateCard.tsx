import { buildGoUrl, AffiliatePartner } from '../lib/affiliates'

type Props = {
  name: string
  price?: string
  partner?: AffiliatePartner
  query?: string
  anime?: string
  malId?: number
  href?: string
  cta?: string
  affiliate?: boolean
}

export default function AffiliateCard({
  name,
  price,
  partner,
  query,
  anime,
  malId,
  href,
  cta,
  affiliate = true,
}: Props) {
  const link = href || (partner ? buildGoUrl(partner, { query, anime, malId }) : undefined)
  const buttonLabel = cta || (affiliate ? `Ir a ${name}` : 'Más info')

  return (
    <div className="rounded-xl border border-white/6 bg-surface-3/40 p-4 flex flex-col justify-between hover:border-accent/25 hover:bg-surface-3/70 transition duration-300 min-h-[140px]">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="font-display font-semibold text-text text-sm">{name}</h4>
          {affiliate && link && <span className="text-[9px] uppercase tracking-wider text-faint">Afiliado</span>}
        </div>
        {price && <p className="text-xs text-muted">{price}</p>}
      </div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel={affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'}
          className="mt-4 btn-primary text-xs text-center py-2 focus-ring"
        >
          {buttonLabel}
        </a>
      ) : (
        <p className="mt-4 text-xs text-faint">Según tu plan</p>
      )}
    </div>
  )
}
