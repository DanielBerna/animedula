import AnimeCard from '../../../components/AnimeCard'
import EditorialReviewBlock from '../../../components/EditorialReview'
import DetailPoster from '../../../components/DetailPoster'
import ReportButton from '../../../components/ReportButton'
import ContentSection from '../../../components/ContentSection'
import Gallery from '../../../components/Gallery'
import WhereToWatch from '../../../components/WhereToWatch'
import MerchSection from '../../../components/MerchSection'
import MetaItem from '../../../components/MetaItem'
import Badge from '../../../components/Badge'
import { getEditorialReview } from '../../../lib/editorial'
import { fetchJikan, getBestImageUrl } from '../../../lib/jikan'

type Props = { params: Promise<{ slug: string }> }

export default async function Page({ params }: Props) {
  const { slug } = await params
  const data = await fetchJikan(`/anime/${slug}`, 0)
  const anime = data?.data

  const title = anime?.title || `Anime ${slug}`
  const image = getBestImageUrl(anime?.images)
  const synopsis = anime?.synopsis || 'Sinopsis no disponible.'
  const malId = anime?.mal_id ?? (Number.isFinite(Number(slug)) ? Number(slug) : slug)
  const genres = anime?.genres?.map((g: { name: string }) => g.name) || []
  const streaming = anime?.streaming?.map((s: { name: string; url: string }) => ({ name: s.name, url: s.url }))

  const review = await getEditorialReview({
    kind: 'anime',
    id: malId,
    title,
    synopsis,
    score: anime?.score,
    genres,
    status: anime?.status,
  })

  return (
    <div className="section-anime space-y-8 enter-up">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-4 xl:col-span-3">
          <DetailPoster
            title={title}
            image={image}
            images={anime?.images}
            kind="anime"
            badges={
              <>
                <Badge>Anime</Badge>
                {anime?.score && <span className="score-badge">★ {anime.score}</span>}
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

          {(anime?.episodes || anime?.status || anime?.year) && (
            <ContentSection eyebrow="Ficha" title="Datos técnicos">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {anime?.episodes && <MetaItem label="Episodios" value={anime.episodes} />}
                {anime?.status && <MetaItem label="Estado" value={anime.status} />}
                {anime?.score && <MetaItem label="Puntuación MAL" value={anime.score} />}
                {anime?.year && <MetaItem label="Año" value={anime.year} />}
              </dl>
            </ContentSection>
          )}

          {image && (
            <ContentSection eyebrow="Visual" title="Galería">
              <Gallery images={[image]} />
            </ContentSection>
          )}

          <WhereToWatch animeTitle={title} malId={Number(malId)} sources={streaming} />
          <MerchSection animeTitle={title} malId={Number(malId)} />
        </div>
      </div>

      <section className="pt-2">
        <div className="section-head">
          <h2 className="font-display text-xl font-bold text-text">También te puede gustar</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AnimeCard key={i} title={`Próximamente ${i + 1}`} image={null} score={null} />
          ))}
        </div>
      </section>
    </div>
  )
}
