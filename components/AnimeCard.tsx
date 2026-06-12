import Link from 'next/link'

type Props = {
  slug?: string | null
  title: string
  image?: string | null
  score?: number | null
  rank?: number
}

export default function AnimeCard({ slug, title, image, score, rank }: Props) {
  return (
    <article className="poster-card enter-up group">
      <Link href={`/anime/${slug || ''}`} className="block">
        <div className="relative overflow-hidden">
          {image ? (
            <img src={image} alt={title} className="poster-img" loading="lazy" />
          ) : (
            <div className="poster-img bg-surface-4 flex items-center justify-center text-4xl text-faint">⬡</div>
          )}
          <div className="poster-overlay" />
          {typeof rank === 'number' && (
            <span className="absolute top-3 left-3 z-10 tag tag-accent">#{rank}</span>
          )}
          {typeof score === 'number' && (
            <span className="absolute top-3 right-3 z-10 score-badge">
              ★ {score.toFixed(1)}
            </span>
          )}
          <div className="poster-meta">
            <h3 className="font-display font-semibold text-[0.95rem] leading-snug text-text line-clamp-2 group-hover:text-white transition">
              {title}
            </h3>
            <p className="text-[11px] text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Ver reseña →
            </p>
          </div>
        </div>
      </Link>
    </article>
  )
}
