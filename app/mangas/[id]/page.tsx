import Link from 'next/link'
import EditorialReviewBlock from '../../../components/EditorialReview'
import DetailPoster from '../../../components/DetailPoster'
import ReportButton from '../../../components/ReportButton'
import ContentSection from '../../../components/ContentSection'
import MerchSection from '../../../components/MerchSection'
import MexicoBadge from '../../../components/MexicoBadge'
import MetaItem from '../../../components/MetaItem'
import Badge from '../../../components/Badge'
import { buildGoUrl } from '../../../lib/affiliates'
import { getEditorialReview } from '../../../lib/editorial'
import { fetchJikan } from '../../../lib/jikan'

type Props = { params: Promise<{ id: string }> }

export default async function MangaDetailPage({ params }: Props) {
  const { id } = await params
  const data = await fetchJikan(`/manga/${id}`, 0)
  const m = data?.data

  const title = m?.title || `Manga ${id}`
  const image = m?.images?.jpg?.image_url
  const synopsis = m?.synopsis || 'Sinopsis no disponible.'
  const genres = m?.genres?.map((g: any) => g.name) || []
  const amazonUrl = buildGoUrl('amazon', { query: `${title} manga tomo` })
  const mlUrl = buildGoUrl('mercadolibre', { query: `${title} manga` })

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
      <div className="section-hero section-hero-manga">
        <MexicoBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-4 xl:col-span-3">
          <DetailPoster
            title={title}
            image={image}
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

          <ContentSection eyebrow="Metadata" title="Ficha">
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {m?.chapters && <MetaItem label="Capítulos" value={m.chapters} />}
              {m?.volumes && <MetaItem label="Volúmenes" value={m.volumes} />}
              {m?.status && <MetaItem label="Estado" value={m.status} />}
            </dl>
          </ContentSection>

          <ContentSection eyebrow="Comprar" title="Dónde conseguirlo">
            <div className="flex flex-wrap gap-3">
              <a href={amazonUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary text-sm">
                Amazon México
              </a>
              <a href={mlUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-ghost text-sm">
                Mercado Libre
              </a>
              <Link href="/mangas" className="btn-ghost text-sm">← Volver al listado</Link>
            </div>
          </ContentSection>

          <MerchSection animeTitle={title} malId={Number(id)} />
        </div>
      </div>
    </div>
  )
}
