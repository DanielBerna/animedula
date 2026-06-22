import { RSS_FEEDS } from '../lib/rss'
import { getSourceSite } from '../lib/news/sources'

type Props = {
  compact?: boolean
}

export default function NewsSourcesFooter({ compact }: Props) {
  const all = Object.entries(RSS_FEEDS).flatMap(([, feeds]) => feeds)

  return (
    <footer className={`news-sources-footer${compact ? ' is-compact' : ''}`}>
      <p className="news-sources-title">Fuentes de noticias</p>
      <p className="text-xs text-muted mb-3">
        Los titulares y resúmenes pertenecen a sus autores. Animédula enlaza al artículo original y no
        reclama esos contenidos.
      </p>
      <ul className="news-sources-list">
        {all.map((feed) => {
          const site = getSourceSite(feed.name)
          return (
            <li key={feed.url}>
              <a
                href={site?.url || feed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-sources-link"
              >
                {site?.label || feed.name}
              </a>
              <span className="news-sources-lang">{feed.lang === 'es' ? 'ES' : 'EN → ES'}</span>
            </li>
          )
        })}
      </ul>
    </footer>
  )
}
