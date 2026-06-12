import Link from 'next/link'
import type { NewsCategory, NewsItem } from '../lib/rss'
import { DETAIL_COPY, NEWS_COPY } from '../lib/copy'

type Props = {
  items: NewsItem[]
  category: NewsCategory
  title?: string
  emptyMessage?: string
}

function formatDate(value?: string) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NewsFeed({
  items,
  category,
  title = 'Noticias',
  emptyMessage,
}: Props) {
  return (
    <section className="news-feed">
      <div className="section-head">
        <div>
          <p className="eyebrow mb-1">{NEWS_COPY.eyebrow}</p>
          <h2 className="font-display text-xl font-bold text-text">{title}</h2>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="news-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/noticias/${category}/${item.slug}`}
                className="news-item group"
              >
                <div className="news-item-meta">
                  <span className="news-source">{item.source}</span>
                  {formatDate(item.publishedAt) ? (
                    <time className="news-date" dateTime={item.publishedAt}>
                      {formatDate(item.publishedAt)}
                    </time>
                  ) : null}
                </div>
                <h3 className="news-title">{item.title}</h3>
                {item.summary ? (
                  <p className="news-summary">{item.summary}</p>
                ) : null}
                <span className="news-cta">{DETAIL_COPY.readMore} →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted card-glass p-5">
          {emptyMessage || NEWS_COPY.empty}
        </p>
      )}
    </section>
  )
}
