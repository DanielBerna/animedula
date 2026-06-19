import NewsCard from './NewsCard'
import type { NewsCategory, NewsItem } from '../lib/rss'
import { NEWS_COPY } from '../lib/copy'

type Props = {
  items: NewsItem[]
  category: NewsCategory
  title?: string
  emptyMessage?: string
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
        <div className="news-grid news-grid-compact">
          {items.map((item) => (
            <NewsCard key={item.id} item={{ ...item, category }} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted card-glass p-5">
          {emptyMessage || NEWS_COPY.empty}
        </p>
      )}
    </section>
  )
}
