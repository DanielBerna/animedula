import Link from 'next/link'
import AnimeCard from '../components/AnimeCard'
import HomeHero from '../components/HomeHero'
import MangaCard from '../components/MangaCard'
import CalendarRow from '../components/CalendarRow'
import HubCard from '../components/HubCard'
import AdSlot from '../components/AdSlot'
import AffiliateDisclosure from '../components/AffiliateDisclosure'
import HomeHybridFeed from '../components/HomeHybridFeed'
import { UI } from '../lib/copy'
import { getHybridHomeFeed } from '../lib/community/home-feed'
import { fetchJikan, fetchTopAnime, fetchTopManga, getBestImageUrl, mapJikanList } from '../lib/jikan'

export const revalidate = 21600

export default async function Home() {
  const [trending, upcomingRes, mangas, feed] = await Promise.all([
    fetchTopAnime(6),
    fetchJikan('/seasons/upcoming?limit=4'),
    fetchTopManga(4),
    getHybridHomeFeed(8, 5),
  ])

  const upcoming = mapJikanList(upcomingRes)
  const heroImages = trending.map((a) => getBestImageUrl(a.images))

  return (
    <div className="space-y-12">
      <HomeHero images={heroImages} />

      <section className="enter-up enter-up-d1">
        <div className="section-head">
          <div>
            <p className="eyebrow mb-1">Descubre</p>
            <h2 className="font-display text-2xl font-bold text-text">Secciones</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <HubCard variant="calendar" href="/calendario" delay={0} />
          <HubCard variant="manga" href="/mangas" delay={60} />
          <HubCard variant="gaming" href="/videojuegos" delay={120} />
          <HubCard variant="collect" href="/coleccionables" delay={180} />
          <HubCard variant="tech" href="/tecnologia" delay={240} />
        </div>
      </section>

      <HomeHybridFeed items={feed} />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_HOME_TOP || ''} className="ad-placeholder" />

      <section className="enter-up enter-up-d2">
        <div className="section-head">
          <div>
            <p className="eyebrow mb-1">Ranking</p>
            <h2 className="font-display text-2xl font-bold text-text">Tendencias</h2>
          </div>
          <Link href="/explorar" className="section-link">{UI.seeAll} →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {trending.map((anime, i) => (
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
      </section>

      <section className="section-calendar enter-up">
        <div className="section-head">
          <div>
            <p className="eyebrow mb-1" style={{ color: '#A78BFA' }}>Próximos</p>
            <h2 className="font-display text-xl font-bold text-text">Por estrenar</h2>
          </div>
          <Link href="/calendario" className="section-link">Ver temporadas →</Link>
        </div>
        <div className="space-y-2">
          {upcoming.map((a) => (
            <CalendarRow key={a.mal_id} anime={a} label="Próximo estreno" />
          ))}
        </div>
      </section>

      <section className="section-manga enter-up">
        <div className="section-head">
          <div>
            <p className="eyebrow mb-1" style={{ color: '#FB923C' }}>Lectura</p>
            <h2 className="font-display text-xl font-bold text-text">Top mangas</h2>
          </div>
          <Link href="/mangas" className="section-link">Ver mangas →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mangas.map((m) => (
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
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_HOME_BOTTOM || ''} className="ad-placeholder" />

      <AffiliateDisclosure />
    </div>
  )
}
