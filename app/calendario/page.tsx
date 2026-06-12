import AnimeCard from '../../components/AnimeCard'
import CalendarRow from '../../components/CalendarRow'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import { fetchJikan, getBestImageUrl, getSeasonLabel, mapJikanList, SEASON_NAMES } from '../../lib/jikan'

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
      <PageHeader variant="calendar" images={heroImages} eyebrow="Estrenos" title="Calendario" />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_CALENDAR || ''} className="ad-placeholder mb-8" />

      <section className="season-block enter-up">
        <h2 className="season-label">
          <span>En emisión</span>
          <span className="tag tag-sec text-[10px]">{SEASON_NAMES[season]} {year}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
          {now.map((a) => (
            <AnimeCard key={a.mal_id} slug={String(a.mal_id)} title={a.title} image={getBestImageUrl(a.images)} score={a.score} />
          ))}
        </div>
      </section>

      <section className="season-block enter-up">
        <h2 className="season-label">Próxima temporada</h2>
        <div className="space-y-2 mb-8">
          {upcoming.map((a) => (
            <CalendarRow key={a.mal_id} anime={a} label="Por estrenar" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {upcoming.map((a) => (
            <AnimeCard key={`card-${a.mal_id}`} slug={String(a.mal_id)} title={a.title} image={getBestImageUrl(a.images)} score={a.score} />
          ))}
        </div>
      </section>
    </div>
  )
}
