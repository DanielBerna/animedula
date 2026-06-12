import GameCard from '../../components/GameCard'
import NewsFeed from '../../components/NewsFeed'
import AdSlot from '../../components/AdSlot'
import PageHeader from '../../components/PageHeader'
import AffiliateDisclosure from '../../components/AffiliateDisclosure'
import { NEWS_COPY, SECTION_COPY } from '../../lib/copy'
import { fetchAnimeGames, fetchFeaturedGames } from '../../lib/games'
import { fetchNews } from '../../lib/rss'

export const revalidate = 7200

export default async function VideojuegosPage() {
  const [animeGames, featured, news] = await Promise.all([
    fetchAnimeGames(12),
    fetchFeaturedGames(6),
    fetchNews('gaming', 8),
  ])

  const heroImages = animeGames.map((g) => g.thumbnail)

  return (
    <div className="section-gaming space-y-10">
      <PageHeader
        variant="gaming"
        images={heroImages}
        eyebrow={SECTION_COPY.gamingEyebrow}
        title="Videojuegos"
        description={SECTION_COPY.gamingDesc}
      />

      <AffiliateDisclosure />

      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow mb-1" style={{ color: '#A78BFA' }}>{SECTION_COPY.gamingAnime}</p>
            <h2 className="font-display text-xl font-bold text-text">{SECTION_COPY.gamingFeatured}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {animeGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow mb-1">Gratis</p>
            <h2 className="font-display text-xl font-bold text-text">{SECTION_COPY.gamingPopular}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {featured.map((game) => (
            <GameCard key={`feat-${game.id}`} game={game} />
          ))}
        </div>
      </section>

      <NewsFeed
        title={NEWS_COPY.gamingTitle}
        category="gaming"
        items={news}
        emptyMessage={NEWS_COPY.gamingEmpty}
      />

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_GAMING || ''} className="ad-placeholder" />
    </div>
  )
}
