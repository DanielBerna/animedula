import Link from 'next/link'
import type { NewsItem } from '../lib/rss'
import { NEWS_CATEGORY_CLASS, NEWS_CATEGORY_LABELS } from '../lib/news/search'
import { DETAIL_COPY } from '../lib/copy'

type Props = {
  item: NewsItem
  variant?: 'default' | 'hero' | 'side'
}

function formatDate(value?: string) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export default function NewsCard({ item, variant = 'default' }: Props) {
  const href = `/noticias/${item.category}/${item.slug}`
  const date = formatDate(item.publishedAt)
  const catClass = NEWS_CATEGORY_CLASS[item.category]
  const catLabel = NEWS_CATEGORY_LABELS[item.category]

  return (
    <article className={`news-card news-card-${variant} enter-up group`}>
      <Link href={href} className="news-card-link">
        <div className={`news-card-cover ${catClass}`}>
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="news-card-img"
            />
          ) : (
            <div className="news-card-placeholder" aria-hidden>
              <span className="news-card-placeholder-icon">
                {item.category === 'gaming' ? '🎮' : item.category === 'tech' ? '⚡' : '✦'}
              </span>
            </div>
          )}
          <span className={`news-card-cat ${catClass}`}>{catLabel}</span>
        </div>
        <div className="news-card-body">
          <div className="news-card-meta">
            <span className="news-source">{item.source}</span>
            {date ? (
              <time className="news-date" dateTime={item.publishedAt}>
                {date}
              </time>
            ) : null}
          </div>
          <h3 className="news-card-title">{item.title}</h3>
          {item.summary && variant !== 'side' ? (
            <p className="news-card-summary">{item.summary}</p>
          ) : null}
          <span className="news-cta">{DETAIL_COPY.readMore} →</span>
        </div>
      </Link>
    </article>
  )
}
