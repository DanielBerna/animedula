import Link from 'next/link'

type Props = {
  mal_id: number
  title: string
  image?: string | null
  score?: number | null
  chapters?: number | null
}

export default function MangaCard({ mal_id, title, image, score, chapters }: Props) {
  return (
    <article className="manga-card enter-up group relative">
      <Link href={`/mangas/${mal_id}`} className="block">
        <div className="relative overflow-hidden">
          <div className="manga-spine" />
          {image ? (
            <img src={image} alt={title} className="manga-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="manga-cover flex items-center justify-center text-4xl text-faint">📖</div>
          )}
          {typeof score === 'number' && (
            <span className="absolute top-2 right-2 score-badge text-[10px]">★ {score.toFixed(1)}</span>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-display font-semibold text-sm text-text line-clamp-2 leading-snug">{title}</h3>
          {chapters && <p className="text-[11px] text-muted mt-1">{chapters} caps.</p>}
        </div>
      </Link>
    </article>
  )
}
