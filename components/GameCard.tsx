import Link from 'next/link'
import Image from 'next/image'
import type { FreeGame } from '../lib/games'
import { UI } from '../lib/copy'

type Props = {
  game: FreeGame
}

export default function GameCard({ game }: Props) {
  return (
    <article className="game-card enter-up group">
      <Link href={`/videojuegos/${game.id}`} className="block">
        <div className="game-card-cover">
          <Image
            src={game.thumbnail}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
          <span className="game-card-genre">{game.genre}</span>
        </div>
        <div className="game-card-body">
          <h3 className="font-display font-semibold text-sm text-text line-clamp-2">{game.title}</h3>
          <p className="text-[11px] text-muted mt-1 line-clamp-2">{game.short_description}</p>
          <p className="text-[10px] text-faint mt-2">{game.platform}</p>
          <span className="text-[10px] text-accent mt-2 inline-block opacity-0 group-hover:opacity-100 transition">
            {UI.seeReview} →
          </span>
        </div>
      </Link>
    </article>
  )
}
