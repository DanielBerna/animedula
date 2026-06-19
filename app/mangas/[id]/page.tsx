import EditorialReviewBlock from '../../../components/EditorialReview'
import DetailPoster from '../../../components/DetailPoster'
import ReportButton from '../../../components/ReportButton'
import ContentSection from '../../../components/ContentSection'
import ContentTabs from '../../../components/ContentTabs'
import MangaProductSection from '../../../components/MangaProductSection'
import MerchSection from '../../../components/MerchSection'
import MetaItem from '../../../components/MetaItem'
import Badge from '../../../components/Badge'
import CommentSection from '../../../components/CommentSection'
import ForumThread from '../../../components/ForumThread'
import SubmissionForm from '../../../components/SubmissionForm'
import TrackListButton from '../../../components/TrackListButton'
import UserReviewSection from '../../../components/UserReviewSection'
import ScreenshotSection from '../../../components/ScreenshotSection'
import { getAuthUser } from '../../../lib/auth'
import { getEditorialReview } from '../../../lib/editorial'
import { fetchJikan, getBestImageUrl } from '../../../lib/jikan'

type Props = { params: Promise<{ id: string }> }

export default async function MangaDetailPage({ params }: Props) {
  const { id } = await params
  const data = await fetchJikan(`/manga/${id}`, 0)
  const m = data?.data

  const title = m?.title || `Manga ${id}`
  const image = getBestImageUrl(m?.images)
  const synopsis = m?.synopsis || 'Sinopsis no disponible.'
  const genres = m?.genres?.map((g: { name: string }) => g.name) || []

  const user = await getAuthUser()
  const returnTo = `/mangas/${id}`

  const review = await getEditorialReview({
    kind: 'manga',
    id,
    title,
    synopsis,
    score: m?.score,
    genres,
    status: m?.status,
    chapters: m?.chapters,
  })

  const infoTab = (
    <div className="space-y-5">
      <ContentSection eyebrow="Referencia" title="Sinopsis oficial (MAL)">
        <p className="text-sm text-muted leading-[1.8]">{synopsis}</p>
      </ContentSection>

      <ContentSection eyebrow="Ficha" title="Datos del manga">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {m?.chapters && <MetaItem label="Capítulos" value={m.chapters} />}
          {m?.volumes && <MetaItem label="Volúmenes" value={m.volumes} />}
          {m?.status && <MetaItem label="Estado" value={m.status} />}
        </dl>
      </ContentSection>

      <MangaProductSection title={title} coverImage={image} />

      <MerchSection animeTitle={title} malId={Number(id)} />
    </div>
  )

  const reviewsTab = (
    <div className="space-y-5">
      <EditorialReviewBlock review={review} />
      <UserReviewSection
        contentType="manga"
        contentId={String(id)}
        loggedIn={Boolean(user)}
        returnTo={returnTo}
      />
      <ContentSection eyebrow="Colabora" title="Mejorar la reseña editorial">
        <SubmissionForm kind="manga" malId={Number(id)} loggedIn={Boolean(user)} />
      </ContentSection>
    </div>
  )

  const communityTab = (
    <div className="space-y-5">
      <div className="card-glass p-5">
        <TrackListButton
          contentType="manga"
          contentId={String(id)}
          title={title}
          imageUrl={image}
          loggedIn={Boolean(user)}
          returnTo={returnTo}
        />
      </div>
      <CommentSection kind="manga" malId={Number(id)} loggedIn={Boolean(user)} returnTo={returnTo} />
      <div className="card-glass p-5">
        <h3 className="font-display text-lg font-semibold text-text mb-4">Foro de esta ficha</h3>
        <ForumThread
          loggedIn={Boolean(user)}
          returnTo={returnTo}
          contentType="manga"
          contentId={String(id)}
          compact
        />
      </div>
    </div>
  )

  const capturasTab = (
    <ContentSection eyebrow="Comunidad" title="Capturas de fans">
      <ScreenshotSection
        contentType="manga"
        contentId={String(id)}
        loggedIn={Boolean(user)}
        returnTo={returnTo}
      />
    </ContentSection>
  )

  return (
    <div className="section-manga space-y-8 enter-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-4 xl:col-span-3">
          <DetailPoster
            title={title}
            image={image}
            images={m?.images}
            kind="manga"
            badges={
              <>
                <Badge>Manga</Badge>
                {m?.score && <span className="score-badge">★ {m.score}</span>}
              </>
            }
            footer={<ReportButton />}
          />
        </div>

        <div className="lg:col-span-8 xl:col-span-9">
          <header className="mb-5">
            <p className="eyebrow mb-1">Ficha</p>
            <h1 className="page-title">{title}</h1>
          </header>
          <ContentTabs
            defaultTab="info"
            tabs={[
              { id: 'info', label: 'Info', icon: 'ℹ️', content: infoTab },
              { id: 'resenas', label: 'Reseñas', icon: '★', content: reviewsTab },
              { id: 'comunidad', label: 'Comunidad', icon: '💬', content: communityTab },
              { id: 'capturas', label: 'Capturas', icon: '📸', content: capturasTab },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
