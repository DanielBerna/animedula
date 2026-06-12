import Link from 'next/link'
import EditorialReviewBlock from '../../../components/EditorialReview'
import DetailPoster from '../../../components/DetailPoster'
import ReportButton from '../../../components/ReportButton'
import ContentSection from '../../../components/ContentSection'
import MangaProductSection from '../../../components/MangaProductSection'
import MerchSection from '../../../components/MerchSection'
import MetaItem from '../../../components/MetaItem'
import Badge from '../../../components/Badge'
import { buildGoUrl } from '../../../lib/affiliates'
import CommentSection from '../../../components/CommentSection'
import SubmissionForm from '../../../components/SubmissionForm'
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
  const amazonUrl = buildGoUrl('amazon', { query: `${title} manga tomo` })
  const mlUrl = buildGoUrl('mercadolibre', { query: `${title} manga` })

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

        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <EditorialReviewBlock review={review} />

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

          <ContentSection eyebrow="Enlaces" title="Búsqueda rápida">
            <div className="flex flex-wrap gap-3">
              <a href={amazonUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary text-sm">
                Ver en Amazon
              </a>
              <a href={mlUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-ghost text-sm">
                Buscar en Mercado Libre
              </a>
              <Link href="/mangas" className="btn-ghost text-sm">← Volver al listado</Link>
            </div>
          </ContentSection>

          <MerchSection animeTitle={title} malId={Number(id)} />

          <ContentSection eyebrow="Colabora" title="Mejorar la reseña">
            <SubmissionForm kind="manga" malId={Number(id)} loggedIn={Boolean(user)} />
          </ContentSection>

          <CommentSection kind="manga" malId={Number(id)} loggedIn={Boolean(user)} returnTo={returnTo} />
        </div>
      </div>
    </div>
  )
}
