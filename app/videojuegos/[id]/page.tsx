import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import AffiliateDisclosure from '../../../components/AffiliateDisclosure'
import { DETAIL_COPY, SECTION_COPY } from '../../../lib/copy'
import { fetchLocalizedGame } from '../../../lib/games'

export const revalidate = 86400

type Props = {
  params: Promise<{ id: string }>
}

function formatDate(value?: string) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function VideojuegoDetailPage({ params }: Props) {
  const { id } = await params
  const gameId = Number(id)
  if (!Number.isFinite(gameId)) notFound()

  const game = await fetchLocalizedGame(gameId)
  if (!game) notFound()

  const description = game.description || game.short_description
  const release = formatDate(game.release_date)

  return (
    <div className="section-gaming space-y-8 enter-up">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/videojuegos" className="section-link">← {DETAIL_COPY.backToGames}</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4">
          <div className="detail-poster-wrap relative aspect-[16/10] rounded-xl overflow-hidden border border-white/10">
            <Image
              src={game.thumbnail}
              alt={game.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 360px"
              unoptimized
              priority
            />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-5">
          <header className="space-y-3">
            <p className="eyebrow">{SECTION_COPY.gamingEyebrow}</p>
            <h1 className="page-title">{game.title}</h1>
          </header>

          <div className="flex flex-wrap gap-2">
            <span className="tag tag-accent">{game.genre}</span>
            <span className="tag tag-sec">{game.platform}</span>
            {game.status ? <span className="tag tag-gold">{game.status}</span> : null}
            {release ? <span className="tag">{release}</span> : null}
          </div>

          {(game.developer || game.publisher) && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {game.developer ? (
                <div className="card-glass p-3">
                  <dt className="text-faint text-xs uppercase tracking-wide">{DETAIL_COPY.developer}</dt>
                  <dd className="text-text font-medium mt-1">{game.developer}</dd>
                </div>
              ) : null}
              {game.publisher ? (
                <div className="card-glass p-3">
                  <dt className="text-faint text-xs uppercase tracking-wide">{DETAIL_COPY.publisher}</dt>
                  <dd className="text-text font-medium mt-1">{game.publisher}</dd>
                </div>
              ) : null}
            </dl>
          )}

          <section className="card-glass p-5 md:p-6">
            <h2 className="font-display font-semibold text-lg text-text mb-3">{DETAIL_COPY.aboutGame}</h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{description}</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <a
              href={game.game_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="btn-primary"
            >
              {DETAIL_COPY.playFree}
            </a>
            <Link href="/videojuegos" className="btn-ghost">
              {DETAIL_COPY.moreGames}
            </Link>
          </div>

          <AffiliateDisclosure />
          <p className="text-xs text-faint">{DETAIL_COPY.translationNote}</p>
        </div>
      </div>
    </div>
  )
}
