import { attributionLine, getSourceSite } from '../lib/news/sources'

type Props = {
  sourceName: string
  articleUrl: string
  className?: string
}

/** Crédito visible a la fuente real del artículo. */
export default function NewsSourceCredit({ sourceName, articleUrl, className = '' }: Props) {
  const site = getSourceSite(sourceName)

  return (
    <aside className={`news-source-credit ${className}`.trim()}>
      <p className="text-sm text-muted">{attributionLine(sourceName)}</p>
      <p className="text-xs text-faint mt-1">
        Resumen adaptado al español. El contenido completo está en el sitio del medio.
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">
          Leer en {site?.label || sourceName} →
        </a>
        {site && site.url !== articleUrl ? (
          <a href={site.url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">
            Visitar {site.label}
          </a>
        ) : null}
      </div>
    </aside>
  )
}
