import AnimeCard from '../../components/AnimeCard'
import CalendarRow from '../../components/CalendarRow'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import SeasonPicker from '../../components/SeasonPicker'
import {
  fetchJikan,
  fetchSeasonPages,
  getBestImageUrl,
  getSeasonLabel,
  mapJikanList,
  SEASON_NAMES,
} from '../../lib/jikan'
import {
  formatSeasonYear,
  getCurrentSeasonInfo,
  groupAnimeBySeasonYear,
  isSeasonKey,
} from '../../lib/seasons'

export const revalidate = 21600

type Props = {
  searchParams: Promise<{ year?: string; season?: string }>
}

export default async function CalendarioPage({ searchParams }: Props) {
  const params = await searchParams
  const current = getCurrentSeasonInfo()
  const browseYear = params.year ? Number(params.year) : undefined
  const browseSeason = isSeasonKey(params.season) ? params.season : undefined
  const browsing = Boolean(browseYear && browseSeason)

  const calendarSeason = getSeasonLabel()
  const calendarYear = new Date().getFullYear()

  // Estrenos: traemos varias páginas para incluir TODOS los próximos, también los menos conocidos.
  const [nowRes, upcomingPages, browsePages] = await Promise.allSettled([
    browsing ? Promise.resolve(null) : fetchJikan('/seasons/now?limit=25'),
    browsing ? Promise.resolve([]) : fetchSeasonPages('/seasons/upcoming', 4),
    browsing ? fetchSeasonPages(`/seasons/${browseYear}/${browseSeason}`, 3) : Promise.resolve([]),
  ])

  const now = mapJikanList(nowRes.status === 'fulfilled' ? nowRes.value : null)
  const upcoming = upcomingPages.status === 'fulfilled' ? upcomingPages.value : []
  const browse = browsePages.status === 'fulfilled' ? browsePages.value : []
  const upcomingGroups = groupAnimeBySeasonYear(upcoming)

  const heroSource = browsing ? browse : [...now, ...upcoming]
  const heroImages = heroSource.map((a) => getBestImageUrl(a.images))

  const pageTitle = browsing && browseSeason && browseYear
    ? formatSeasonYear(browseSeason, browseYear)
    : 'Temporadas'

  return (
    <div className="section-calendar space-y-8">
      <PageHeader
        variant="calendar"
        images={heroImages}
        eyebrow={browsing ? 'Archivo' : 'Estrenos y emisión'}
        title={pageTitle}
      />

      <SeasonPicker selectedYear={browseYear} selectedSeason={browseSeason} />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_CALENDAR || ''} className="ad-placeholder" />

      {browsing ? (
        <section className="season-block enter-up">
          <h2 className="season-label">
            <span>Anime de la temporada</span>
            <span className="tag tag-sec text-[10px]">
              {browseSeason && browseYear ? formatSeasonYear(browseSeason, browseYear) : ''}
            </span>
          </h2>
          {browse.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {browse.map((a, i) => (
                <AnimeCard
                  key={a.mal_id}
                  slug={String(a.mal_id)}
                  title={a.title}
                  image={getBestImageUrl(a.images)}
                  score={a.score}
                  rank={i + 1}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted card-glass p-6">
              No hay datos para esta temporada. Prueba otra combinación de año y estación.
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="season-block enter-up">
            <h2 className="season-label">
              <span>En emisión</span>
              <span className="tag tag-sec text-[10px]">
                {SEASON_NAMES[calendarSeason]} {calendarYear}
              </span>
            </h2>
            <p className="text-sm text-muted mb-4">
              Series que se transmiten ahora · temporada {formatSeasonYear(current.season, current.year)}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {now.map((a, i) => (
                <AnimeCard
                  key={a.mal_id}
                  slug={String(a.mal_id)}
                  title={a.title}
                  image={getBestImageUrl(a.images)}
                  score={a.score}
                  rank={i + 1}
                />
              ))}
            </div>
          </section>

          <section className="season-block enter-up">
            <h2 className="season-label">Próximos estrenos</h2>
            <p className="text-sm text-muted mb-4">Agrupados por temporada y año de estreno</p>

            {upcomingGroups.length > 0 ? (
              <div className="space-y-8">
                {upcomingGroups.map((group) => (
                  <div key={group.key}>
                    <h3 className="season-subtitle">
                      <span>{group.label}</span>
                      <span className="text-faint font-normal">{group.items.length} títulos</span>
                    </h3>
                    <div className="space-y-2">
                      {group.items.map((a) => (
                        <CalendarRow key={a.mal_id} anime={a} label={group.label} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <CalendarRow key={a.mal_id} anime={a} label="Por estrenar" />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
