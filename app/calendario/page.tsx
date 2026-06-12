import AnimeCard from '../../components/AnimeCard'
import CalendarRow from '../../components/CalendarRow'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import MexicoBadge from '../../components/MexicoBadge'
import { fetchJikan, getBestImageUrl, mapJikanList, SEASON_NAMES, getSeasonLabel } from '../../lib/jikan'

export const revalidate = 21600

export default async function CalendarioPage() {
  const [nowRes, upcomingRes] = await Promise.allSettled([
    fetchJikan('/seasons/now?limit=12'),
    fetchJikan('/seasons/upcoming?limit=12'),
  ])

  const now = mapJikanList(nowRes.status === 'fulfilled' ? nowRes.value : null)
  const upcoming = mapJikanList(upcomingRes.status === 'fulfilled' ? upcomingRes.value : null)
  const season = getSeasonLabel()
  const year = new Date().getFullYear()

  const heroImages = [...now, ...upcoming].map((a) => getBestImageUrl(a.images))

  return (
    <div className="section-calendar">
      <PageHeader variant="calendar" images={heroImages} eyebrow="Estrenos" title="Calendario anime">
        <MexicoBadge />
      </PageHeader>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_CALENDAR || ''} className="ad-placeholder mb-8" />

      <section className="season-block enter-up">
        <h2 className="season-label">
          <span className="tag tag-sec">En emisión</span>
          {SEASON_NAMES[season]} {year}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          {now.slice(0, 6).map((a) => (
            <AnimeCard key={a.mal_id} slug={String(a.mal_id)} title={a.title} image={a.images?.jpg?.image_url} score={a.score} />
          ))}
        </div>
        <div className="space-y-2">
          {now.slice(6).map((a) => (
            <CalendarRow key={a.mal_id} anime={a} label="En emisión" />
          ))}
        </div>
      </section>

      <section className="season-block enter-up enter-up-d1">
        <h2 className="season-label">
          <span className="tag tag-sec">Próxima temporada</span>
          Por estrenar
        </h2>
        <div className="space-y-2">
          {upcoming.length > 0 ? (
            upcoming.map((a) => (
              <CalendarRow key={a.mal_id} anime={a} label="Próximo estreno" />
            ))
          ) : (
            <p className="text-muted text-sm py-8 text-center">Cargando próximos estrenos…</p>
          )}
        </div>
      </section>

      <section className="season-block enter-up enter-up-d2">
        <h2 className="season-label">
          <span className="tag tag-sec">Grid completo</span>
          Próximos en posters
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {upcoming.map((a) => (
            <AnimeCard key={a.mal_id} slug={String(a.mal_id)} title={a.title} image={a.images?.jpg?.image_url} score={a.score} />
          ))}
        </div>
      </section>
    </div>
  )
}
