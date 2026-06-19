type Props = {
  name: string
  price?: string
  href: string
  cta?: string
}

export default function StreamingCard({ name, price, href, cta }: Props) {
  return (
    <div className="rounded-xl border border-white/6 bg-surface-3/40 p-4 flex flex-col justify-between hover:border-accent/25 hover:bg-surface-3/70 transition duration-300 min-h-[140px]">
      <div>
        <h4 className="font-display font-semibold text-text text-sm mb-2">{name}</h4>
        {price && <p className="text-xs text-muted">{price}</p>}
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 btn-primary text-xs text-center py-2 focus-ring"
      >
        {cta || `Ir a ${name}`}
      </a>
    </div>
  )
}
