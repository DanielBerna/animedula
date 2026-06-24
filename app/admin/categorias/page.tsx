import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'

const BADGE_CATEGORIES = ['general', 'forum', 'review', 'social', 'streak', 'cosmetic', 'premium']
const EXPENSE_CATEGORIES = ['ia', 'hosting', 'dominio', 'pagos', 'marketing', 'general']

export default async function AdminCategoriasPage() {
  let plans: { slug: string; name: string; price_mxn_cents: number }[] = []
  let badgeCats: string[] = []

  if (isSupabaseAuthConfigured()) {
    const supabase = await createClient()
    const [p, b] = await Promise.all([
      supabase.from('subscription_plans').select('slug, name, price_mxn_cents').order('sort_order'),
      supabase.from('badges').select('category'),
    ])
    plans = p.data || []
    const fromDb = [...new Set((b.data || []).map((x) => x.category).filter(Boolean))]
    badgeCats = [...new Set([...BADGE_CATEGORIES, ...fromDb])]
  }

  return (
    <div className="admin-page space-y-8">
      <header>
        <p className="eyebrow mb-1">Configuración</p>
        <h1 className="page-title">Categorías</h1>
        <p className="text-sm text-muted mt-2">Referencia de taxonomía para insignias, gastos y planes.</p>
      </header>

      <section className="card-glass p-6">
        <h2 className="font-display font-semibold text-text mb-3">Insignias</h2>
        <div className="flex flex-wrap gap-2">
          {badgeCats.map((c) => (
            <span key={c} className="tag text-xs">
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="card-glass p-6">
        <h2 className="font-display font-semibold text-text mb-3">Gastos operativos</h2>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((c) => (
            <span key={c} className="tag tag-sec text-xs">
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="card-glass p-6">
        <h2 className="font-display font-semibold text-text mb-3">Planes premium</h2>
        <ul className="space-y-2 text-sm">
          {plans.map((p) => (
            <li key={p.slug} className="flex justify-between gap-2">
              <span>{p.name}</span>
              <span className="text-muted">${(p.price_mxn_cents / 100).toFixed(2)} MXN</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-faint mt-4">
          Editar planes en Supabase tabla <code>subscription_plans</code> hasta integrar pagos.
        </p>
      </section>
    </div>
  )
}
