import Link from 'next/link'
import PosterImage from './PosterImage'
import IconOrb from './icons/IconOrb'

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
        <div className="relative overflow-hidden manga-cover-wrap">
          <div className="manga-spine" />
          {image ? (
            <PosterImage src={image} alt={title} fill className="manga-cover object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="manga-cover flex items-center justify-center">
              <IconOrb name="manga" variant="manga" size="md" />
            </div>
          )}
          {typeof score === 'number' && (
            <span className="absolute top-2 right-2 score-badge text-[10px] z-10">★ {score.toFixed(1)}</span>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-display font-semibold text-sm text-text line-clamp-2 leading-snug">{title}</h3>
          {chapters && <p className="text-[11px] text-muted mt-1">{chapters} capítulos</p>}
        </div>
      </Link>
    </article>
  )
}
