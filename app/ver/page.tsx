import Link from 'next/link'
import { fetchJikan, getBestImageUrl, mapJikanList } from '../../lib/jikan'
import WatchSearch from '../../components/watch/WatchSearch'
import WatchSchedule from '../../components/watch/WatchSchedule'

export const revalidate = 21600

export const metadata = {
  title: 'Ver anime · Animédula',
  description: 'Reproductor de anime con episodios desde servidores externos.',
  robots: { index: false, follow: false },
}

function WatchCard({ malId, title, image, episodes }: { malId: number; title: string; image?: string; episodes?: number | null }) {
  return (
    <Link href={`/ver/${malId}`} className="watch-card">
      <div className="watch-card-poster">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" />
        ) : null}
        <span className="watch-card-play" aria-hidden>▶</span>
      </div>
      <p className="watch-card-title">{title}</p>
      {episodes ? <span className="watch-card-eps">{episodes} eps</span> : null}
    </Link>
  )
}

export default async function VerPage() {
  const [nowRes, topRes] = await Promise.allSettled([
    fetchJikan('/seasons/now?limit=24'),
    fetchJikan('/top/anime?limit=24'),
  ])
  const now = mapJikanList(nowRes.status === 'fulfilled' ? nowRes.value : null)
  const top = mapJikanList(topRes.status === 'fulfilled' ? topRes.value : null)

  // Recién estrenados: en emisión ordenados por fecha de estreno más reciente.
  const recent = [...now]
    .filter((a) => a.aired?.from)
    .sort((a, b) => new Date(b.aired!.from!).getTime() - new Date(a.aired!.from!).getTime())
    .slice(0, 18)

  return (
    <div className="space-y-8 enter-up">
      <header className="watch-hero">
        <p className="eyebrow">Sección de visionado</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">Ver anime</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Busca un anime y reproduce sus episodios. El contenido se muestra mediante reproductores
          incrustados de servidores externos; Animédula no aloja los videos.
        </p>
      </header>

      <section>
        <h2 className="season-label mb-3"><span>Buscador</span></h2>
        <WatchSearch />
      </section>

      <WatchSchedule />

      {recent.length > 0 ? (
        <section>
          <h2 className="season-label mb-4"><span>Recién estrenados</span></h2>
          <div className="watch-grid">
            {recent.map((a) => (
              <WatchCard key={a.mal_id} malId={a.mal_id} title={a.title} image={getBestImageUrl(a.images)} episodes={a.episodes} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="season-label mb-4"><span>En emisión</span></h2>
        <div className="watch-grid">
          {now.map((a) => (
            <WatchCard key={a.mal_id} malId={a.mal_id} title={a.title} image={getBestImageUrl(a.images)} episodes={a.episodes} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="season-label mb-4"><span>Catálogo · Populares</span></h2>
        <div className="watch-grid">
          {top.map((a) => (
            <WatchCard key={a.mal_id} malId={a.mal_id} title={a.title} image={getBestImageUrl(a.images)} episodes={a.episodes} />
          ))}
        </div>
      </section>
    </div>
  )
}
