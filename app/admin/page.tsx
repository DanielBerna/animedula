import AdminDraftCard from '../../components/AdminDraftCard'
import AdminNav from '../../components/AdminNav'
import PageHeader from '../../components/PageHeader'
import { getEditorialReview } from '../../lib/editorial'
import { buildFallbackReview } from '../../lib/editorial/fallback'
import { listModerationQueue } from '../../lib/editorial/db'
import { isSupabaseAuthConfigured } from '../../lib/supabase/server'

const SEEDS = [
  { mal_id: 5114, title: 'Fullmetal Alchemist: Brotherhood', kind: 'anime' as const, score: 9.1 },
  { mal_id: 1, title: 'Monster', kind: 'manga' as const, score: 8.9 },
  { mal_id: 1535, title: 'Death Note', kind: 'anime' as const, score: 8.6 },
]

type DraftItem = {
  key: string
  review_id?: string
  mal_id: number
  title: string
  kind: 'anime' | 'manga'
  resumen: string
  veredicto: string
  status: string
}

export default async function AdminPage() {
  const queue = isSupabaseAuthConfigured() ? await listModerationQueue() : []

  const seedDrafts: DraftItem[] = await Promise.all(
    SEEDS.map(async (s) => {
      try {
        const review = await getEditorialReview({
          kind: s.kind,
          id: s.mal_id,
          title: s.title,
          score: s.score,
          genres: ['Drama'],
        })
        return {
          key: `${s.kind}-${s.mal_id}`,
          mal_id: s.mal_id,
          title: s.title,
          kind: s.kind,
          resumen: review.gancho,
          veredicto: review.veredicto,
          status: 'local',
        }
      } catch {
        const fb = buildFallbackReview({ kind: s.kind, id: s.mal_id, title: s.title, score: s.score })
        return {
          key: `${s.kind}-${s.mal_id}`,
          mal_id: s.mal_id,
          title: s.title,
          kind: s.kind,
          resumen: fb.gancho,
          veredicto: fb.veredicto,
          status: 'local',
        }
      }
    })
  )

  const dbItems: DraftItem[] = queue.map((q) => ({
    key: q.id,
    review_id: q.id,
    mal_id: q.mal_id,
    title: `${q.kind === 'manga' ? 'Manga' : 'Anime'} #${q.mal_id}`,
    kind: q.kind,
    resumen: q.gancho,
    veredicto: q.veredicto,
    status: q.status,
  }))

  const drafts = dbItems.length > 0 ? dbItems : seedDrafts

  return (
    <div className="section-anime space-y-8">
      <PageHeader variant="default" eyebrow="Admin" title="Moderación" />

      <AdminNav active="/admin" />

      <section>
        <div className="section-head">
          <h2 className="font-display text-lg font-semibold text-text">Cola de reseñas</h2>
          <span className="tag tag-accent">{drafts.length}</span>
        </div>
        {dbItems.length === 0 && isSupabaseAuthConfigured() && (
          <p className="text-sm text-muted mb-4">
            No hay borradores en Supabase. Las tarjetas de abajo publican desde caché local/IA.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drafts.map((d) => (
            <AdminDraftCard
              key={d.key}
              title={d.title}
              review_id={d.review_id}
              kind={d.kind}
              mal_id={d.mal_id}
              resumen={d.resumen}
              badge={d.veredicto}
              status={d.status}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
