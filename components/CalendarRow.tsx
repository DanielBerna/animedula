import Link from 'next/link'
import { getBestImageUrl, JikanAnime } from '../lib/jikan'
import PosterImage from './PosterImage'

type Props = {
  anime: JikanAnime
  label?: string
}

export default function CalendarRow({ anime, label }: Props) {
  const img = getBestImageUrl(anime.images)
  const date = anime.aired?.from
    ? new Date(anime.aired.from).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Por confirmar'

  const studio = anime.studios?.find((s) => s.name)?.name
  const eps = typeof anime.episodes === 'number' && anime.episodes > 0 ? `${anime.episodes} eps` : null

  return (
    <Link href={`/anime/${anime.mal_id}`} className="calendar-row group">
      <div className="calendar-date">
        <span>{date}</span>
      </div>
      {img ? (
        <div className="relative w-12 h-16 flex-shrink-0 rounded-md overflow-hidden border border-white/8">
          <PosterImage src={img} alt="" fill className="object-cover" sizes="48px" />
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-sm text-text truncate group-hover:text-[var(--sec,var(--accent))] transition">
          {anime.title}
        </h4>
        <p className="text-xs text-muted mt-0.5 truncate">
          {label || anime.status || 'Próximo estreno'}
          {typeof anime.score === 'number' && anime.score > 0 ? ` · ★ ${anime.score}` : ''}
        </p>
        <p className="calendar-row-facts">
          <span>🎬 {studio || 'Estudio por confirmar'}</span>
          <span>· {eps || 'Eps por confirmar'}</span>
        </p>
      </div>
      <span className="text-xs text-faint self-center opacity-0 group-hover:opacity-100 transition">→</span>
    </Link>
  )
}
