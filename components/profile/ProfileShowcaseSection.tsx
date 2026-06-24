import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ShowcaseItem } from '../../lib/profiles/full'
import { showcaseBySection } from '../../lib/profiles/full'

const SECTION_META = {
  anime: { title: 'Anime que estoy viendo', emoji: '📺', empty: 'Sin anime en vitrina' },
  manga: { title: 'Manga que estoy leyendo', emoji: '📖', empty: 'Sin manga en vitrina' },
  game: { title: 'Juegos que juego', emoji: '🎮', empty: 'Sin juegos en vitrina' },
} as const

const STATUS_LABELS: Record<string, string> = {
  watching: 'Viendo',
  reading: 'Leyendo',
  playing: 'Jugando',
  completed: 'Completado',
  pending: 'Pendiente',
  dropped: 'Abandonado',
}

function itemHref(section: string, contentId: string | null): string | null {
  if (!contentId) return null
  const bases: Record<string, string> = {
    anime: '/anime',
    manga: '/mangas',
    game: '/videojuegos',
  }
  const base = bases[section]
  return base ? `${base}/${contentId}` : null
}

type Props = {
  section: 'anime' | 'manga' | 'game'
  items: ShowcaseItem[]
  wallSlot?: ReactNode
}

export default function ProfileShowcaseSection({ section, items, wallSlot }: Props) {
  const meta = SECTION_META[section]
  const slots = showcaseBySection(items, section)
  const filled = slots.filter(Boolean).length

  return (
    <section className="card-glass p-6 profile-showcase-section">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display font-semibold text-text">
            <span className="mr-2" aria-hidden>
              {meta.emoji}
            </span>
            {meta.title}
          </h2>
          <p className="text-xs text-muted mt-1">
            {filled}/5 en vitrina
          </p>
        </div>
      </div>
      <ul className="profile-showcase-grid">
        {slots.map((item, idx) => {
          const slot = idx + 1
          const href = item ? itemHref(section, item.content_id) : null
          const inner = (
            <>
              <div className="profile-showcase-cover">
                {item?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="profile-showcase-img" />
                ) : (
                  <span className="profile-showcase-placeholder">{meta.emoji}</span>
                )}
                <span className="profile-showcase-slot">#{slot}</span>
              </div>
              {item ? (
                <>
                  <p className="profile-showcase-title">{item.title}</p>
                  <span className="tag text-[10px] mt-1">
                    {STATUS_LABELS[item.list_status] || item.list_status}
                  </span>
                </>
              ) : (
                <p className="profile-showcase-empty">{meta.empty}</p>
              )}
            </>
          )

          return (
            <li key={slot} className={`profile-showcase-card ${item ? 'is-filled' : 'is-empty'}`}>
              {item && href ? (
                <Link href={href} className="profile-showcase-link">
                  {inner}
                </Link>
              ) : (
                <div className="profile-showcase-link">{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
      {wallSlot}
    </section>
  )
}
