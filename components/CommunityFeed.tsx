import Link from 'next/link'
import type { CommunityHighlight } from '../lib/community/feed'

type Props = {
  items: CommunityHighlight[]
}

export default function CommunityFeed({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="enter-up">
      <div className="section-head">
        <div>
          <p className="eyebrow mb-1">Comunidad</p>
          <h2 className="font-display text-xl font-bold text-text">Lo que dice la gente</h2>
        </div>
        <Link href="/comunidad" className="section-link">Participar →</Link>
      </div>
      <ul className="news-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="news-item group">
              <div className="news-item-meta">
                <span className="news-source">{item.author}</span>
                <span className="news-source opacity-60">
                  {item.source === 'forum' ? 'Foro' : item.source === 'review' ? 'Reseña' : 'Comentario'}
                </span>
                <time className="news-date">
                  {new Date(item.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </time>
              </div>
              <p className="news-title line-clamp-2">{item.body}</p>
              <span className="news-cta">Ver ficha →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
