import Link from 'next/link'
import { JikanAnime } from '../lib/jikan'

type Props = {
  anime: JikanAnime
  label?: string
}

export default function CalendarRow({ anime, label }: Props) {
  const img = anime.images?.jpg?.image_url
  const date = anime.aired?.from
    ? new Date(anime.aired.from).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    : 'TBA'

  return (
    <Link href={`/anime/${anime.mal_id}`} className="calendar-row group">
      <div className="calendar-date">
        <span>{date}</span>
      </div>
      {img && (
        <img src={img} alt="" className="w-12 h-16 object-cover rounded-md flex-shrink-0 border border-white/8" />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-sm text-text truncate group-hover:text-[var(--sec,var(--accent))] transition">
          {anime.title}
        </h4>
        <p className="text-xs text-muted mt-0.5">
          {label || anime.status || 'Próximo'}
          {typeof anime.score === 'number' && ` · ★ ${anime.score}`}
        </p>
      </div>
      <span className="text-xs text-faint self-center opacity-0 group-hover:opacity-100 transition">→</span>
    </Link>
  )
}
