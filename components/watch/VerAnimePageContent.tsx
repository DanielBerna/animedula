import Link from 'next/link'
import { fetchJikan, getBestImageUrl } from '../../lib/jikan'
import { translateLongToSpanish } from '../../lib/translate'
import { getAuthUser } from '../../lib/auth'
import { resolveAnilistId } from '../../lib/watch/resolve-ids'
import AnimePlayer from './AnimePlayer'
import CommentSection from '../CommentSection'
import ForumThread from '../ForumThread'
import ContentSection from '../ContentSection'

type Props = {
  malIdParam: string
  episode: number
}

export async function generateVerAnimeMetadata(malIdParam: string, episode: number) {
  const data = await fetchJikan(`/anime/${malIdParam}`, 3600)
  const title = data?.data?.title || `Anime ${malIdParam}`
  return {
    title: episode > 1 ? `Ver ${title} · Ep. ${episode} · Animédula` : `Ver ${title} · Animédula`,
    robots: { index: false, follow: false },
  }
}

export default async function VerAnimePageContent({ malIdParam, episode }: Props) {
  const data = await fetchJikan(`/anime/${malIdParam}`, 3600)
  const anime = data?.data

  const title = anime?.title || `Anime ${malIdParam}`
  const malId = Number(anime?.mal_id ?? malIdParam)
  const image = getBestImageUrl(anime?.images)
  const episodes = typeof anime?.episodes === 'number' ? anime.episodes : null
  const studio = anime?.studios?.find((s: { name?: string }) => s?.name)?.name
  const synopsisEs = anime?.synopsis ? await translateLongToSpanish(anime.synopsis) : ''
  const anilistId = await resolveAnilistId(malId)

  const user = await getAuthUser()
  const returnTo = `/ver/${malId}/${episode}`

  return (
    <div className="space-y-6 enter-up max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/ver" className="btn-ghost text-xs">
          ← Ver anime
        </Link>
        <Link href={`/anime/${malId}`} className="btn-ghost text-xs">
          Ver ficha completa →
        </Link>
      </div>

      <header className="watch-detail-head">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="watch-detail-poster" />
        ) : null}
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text">{title}</h1>
          <p className="text-xs text-muted mt-1">
            {[
              episode > 1 ? `Episodio ${episode}` : null,
              studio,
              episodes ? `${episodes} episodios` : null,
              anime?.year,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {synopsisEs ? (
            <p className="text-sm text-muted mt-3 leading-relaxed line-clamp-4">{synopsisEs}</p>
          ) : null}
        </div>
      </header>

      <AnimePlayer
        malId={malId}
        title={title}
        episodeCount={episodes}
        initialEpisode={episode}
        anilistId={anilistId}
        loggedIn={Boolean(user)}
      />

      <ContentSection eyebrow="Comunidad" title="Comentarios del episodio">
        <CommentSection kind="anime" malId={malId} loggedIn={Boolean(user)} returnTo={returnTo} />
      </ContentSection>

      <ContentSection eyebrow="Comunidad" title="Debate del foro">
        <ForumThread
          loggedIn={Boolean(user)}
          returnTo={returnTo}
          contentType="anime"
          contentId={String(malId)}
          compact
        />
      </ContentSection>
    </div>
  )
}
