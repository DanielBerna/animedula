import Link from 'next/link'
import type { HybridFeedItem } from '../lib/community/home-feed'

type Props = {
  items: HybridFeedItem[]
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

const SOURCE_CLASS: Record<string, string> = {
  news: 'feed-badge-news',
  comment: 'feed-badge-community',
  forum: 'feed-badge-forum',
  review: 'feed-badge-review',
}

export default function HomeHybridFeed({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="feed-section enter-up enter-up-d1">
      <div className="section-head">
        <div>
          <p className="eyebrow mb-1">Feed en vivo</p>
          <h2 className="font-display text-2xl font-bold text-text">Noticias y comunidad</h2>
        </div>
        <Link href="/noticias" className="section-link">Ver noticias →</Link>
      </div>

      <ul className="feed-list">
        {items.map((item, i) => (
          <li key={item.id} className="feed-list-item" style={{ animationDelay: `${i * 60}ms` }}>
            <Link href={item.href} className="feed-card group">
              <span className={`feed-badge ${SOURCE_CLASS[item.source] || ''}`}>
                {item.sourceLabel}
              </span>
              <div className="feed-card-body">
                <div className="feed-card-meta">
                  {item.author ? <span className="feed-author">{item.author}</span> : null}
                  {formatDate(item.publishedAt) ? (
                    <time className="feed-date">{formatDate(item.publishedAt)}</time>
                  ) : null}
                </div>
                <p className="feed-card-title">{item.title}</p>
                {item.excerpt && item.source === 'news' ? (
                  <p className="feed-card-excerpt">{item.excerpt}</p>
                ) : null}
                <span className="feed-card-cta">Ver más →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
