import Link from 'next/link'
import { getBestImageUrl } from '../lib/jikan'
import { fetchHomeFeatured } from '../lib/home/featured'
import AnimeCard from '../components/AnimeCard'
import HomeHero from '../components/HomeHero'
import HomeSection from '../components/HomeSection'
import MangaCard from '../components/MangaCard'
import CalendarRow from '../components/CalendarRow'
import HubCard from '../components/HubCard'
import AdSlot from '../components/AdSlot'
import AffiliateDisclosure from '../components/AffiliateDisclosure'
import HomeHybridFeed from '../components/HomeHybridFeed'
import { UI } from '../lib/copy'
import { getHybridHomeFeed } from '../lib/community/home-feed'

export const revalidate = 21600

export default async function Home() {
  const [featured, feed] = await Promise.all([fetchHomeFeatured(), getHybridHomeFeed(8, 5)])

  const heroImages = featured.trending.map((a) => getBestImageUrl(a.images))

  return (
    <div className="home-page space-y-8">
      <HomeHero images={heroImages} />

      <div className="home-magazine">
        {/* Columna 1 — Explorar */}
        <HomeSection
          eyebrow="Navega"
          title="Secciones"
          subtitle="Todo el universo otaku en un clic"
          accent="default"
          className="home-col-explore home-col-explore-desktop"
        >
          <div className="home-hub-stack">
            <HubCard variant="calendar" href="/calendario" delay={0} />
            <HubCard variant="manga" href="/mangas" delay={40} />
            <HubCard variant="gaming" href="/videojuegos" delay={80} />
            <HubCard variant="collect" href="/coleccionables" delay={120} />
            <HubCard variant="tech" href="/tecnologia" delay={160} />
          </div>
        </HomeSection>

        {/* Columna 2 — Tendencias (principal) */}
        <HomeSection
          eyebrow="Temporada"
          title={`Tendencias · ${featured.seasonLabel}`}
          subtitle="Rota cada día dentro de la temporada"
          href="/explorar"
          linkLabel={`${UI.seeAll} →`}
          accent="anime"
          className="home-col-trending"
          bodyClassName="home-column-body-pad"
        >
          <div className="home-anime-grid">
            {featured.trending.map((anime, i) => (
              <AnimeCard
                key={anime.mal_id}
                slug={String(anime.mal_id)}
                title={anime.title}
                image={getBestImageUrl(anime.images)}
                score={anime.score}
                rank={i + 1}
              />
            ))}
          </div>
        </HomeSection>

        {/* Columna 3 — Actividad */}
        <HomeSection
          eyebrow="En vivo"
          title="Noticias y comunidad"
          href="/noticias"
          linkLabel="Ver noticias →"
          accent="news"
          className="home-col-feed"
          bodyClassName="home-column-body-flush"
        >
          <HomeHybridFeed items={feed} variant="column" />
        </HomeSection>

        {/* Fila inferior — Estrenos + Mangas */}
        <HomeSection
          eyebrow="Calendario"
          title="Por estrenar"
          href="/calendario"
          linkLabel="Ver temporadas →"
          accent="calendar"
          className="home-col-upcoming"
          bodyClassName="home-column-body-pad-sm"
        >
          <div className="home-calendar-stack">
            {featured.upcoming.map((a) => (
              <CalendarRow key={a.mal_id} anime={a} label="Próximo estreno" />
            ))}
          </div>
        </HomeSection>

        <HomeSection
          eyebrow="Lectura"
          title="Mangas destacados"
          href="/mangas"
          linkLabel="Ver mangas →"
          accent="manga"
          className="home-col-manga"
          bodyClassName="home-column-body-pad"
        >
          <div className="home-manga-grid">
            {featured.mangas.map((m) => (
              <MangaCard
                key={m.mal_id}
                mal_id={m.mal_id}
                title={m.title}
                image={getBestImageUrl(m.images)}
                score={m.score}
                chapters={m.chapters}
              />
            ))}
          </div>
        </HomeSection>

        <div className="home-col-ad home-span-full">
          <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_HOME_TOP || ''} className="ad-placeholder" />
        </div>
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_HOME_BOTTOM || ''} className="ad-placeholder" />

      <AffiliateDisclosure />
    </div>
  )
}
