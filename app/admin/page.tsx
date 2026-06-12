import AdminDraftCard from '../../components/AdminDraftCard'
import PageHeader from '../../components/PageHeader'
import { getEditorialReview } from '../../lib/editorial'
import { buildFallbackReview } from '../../lib/editorial/fallback'

export default async function AdminPage() {
  const seeds = [
    { mal_id: 5114, title: 'Fullmetal Alchemist: Brotherhood', kind: 'anime' as const, score: 9.1 },
    { mal_id: 1, title: 'Monster', kind: 'manga' as const, score: 8.9 },
    { mal_id: 1535, title: 'Death Note', kind: 'anime' as const, score: 8.6 },
  ]

  const drafts = await Promise.all(
    seeds.map(async (s) => {
      try {
        const review = await getEditorialReview({
          kind: s.kind,
          id: s.mal_id,
          title: s.title,
          score: s.score,
          genres: ['Drama'],
        })
        return { mal_id: s.mal_id, title: s.title, resumen: review.gancho, veredicto: review.veredicto }
      } catch {
        const fb = buildFallbackReview({ kind: s.kind, id: s.mal_id, title: s.title, score: s.score })
        return { mal_id: s.mal_id, title: s.title, resumen: fb.gancho, veredicto: fb.veredicto }
      }
    })
  )

  return (
    <div className="section-anime space-y-8">
      <PageHeader variant="default" eyebrow="Backoffice" title="Panel" />

      <section>
        <div className="section-head">
          <h2 className="font-display text-lg font-semibold text-text">Borradores</h2>
          <span className="tag tag-accent">{drafts.length} items</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drafts.map((d) => (
            <AdminDraftCard
              key={d.mal_id}
              title={d.title}
              mal_id={d.mal_id}
              resumen={d.resumen}
              badge={d.veredicto}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
