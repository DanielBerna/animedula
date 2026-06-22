import Link from 'next/link'
import AdminNav from '../../../components/AdminNav'
import PageHeader from '../../../components/PageHeader'
import { createClient, isSupabaseAuthConfigured } from '../../../lib/supabase/server'

export default async function AdminCatalogoPage() {
  let badges: { slug: string; name: string; category: string }[] = []
  let shop: { slug: string; name: string; price_coins: number; item_type: string; css_class: string | null }[] = []
  let titles: { slug: string; name: string; min_level: number }[] = []
  let plans: { slug: string; name: string; price_mxn_cents: number }[] = []

  if (isSupabaseAuthConfigured()) {
    const supabase = await createClient()
    const [b, s, t, p] = await Promise.all([
      supabase.from('badges').select('slug, name, category').order('slug'),
      supabase.from('shop_items').select('slug, name, price_coins, item_type, css_class').order('price_coins'),
      supabase.from('selectable_titles').select('slug, name, min_level').order('min_level'),
      supabase.from('subscription_plans').select('slug, name, price_mxn_cents').eq('is_active', true),
    ])
    badges = b.data || []
    shop = s.data || []
    titles = t.data || []
    plans = p.data || []
  }

  return (
    <div className="section-anime space-y-10">
      <PageHeader
        variant="default"
        eyebrow="Administración"
        title="Catálogo · premios y premium"
        description="Insignias, marcos, títulos y planes de suscripción. Los cambios en producción se hacen en Supabase o vía SQL (ver docs)."
      />

      <AdminNav active="/admin/catalogo" />

      <div className="flex flex-wrap gap-2">
        <Link href="/admin" className="btn-ghost text-xs">
          ← Moderación reseñas
        </Link>
        <Link href="/perfil" className="btn-ghost text-xs">
          Ver mi perfil premium
        </Link>
      </div>

      <section className="card-glass p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-text">Planes premium</h2>
        <p className="text-sm text-muted">
          Pagos: integrar Stripe o Mercado Pago → webhook → <code className="text-xs">subscription_events</code> +
          activar <code className="text-xs">profiles.is_premium</code>.
        </p>
        {plans.length > 0 ? (
          <ul className="premium-catalog-grid">
            {plans.map((pl) => (
              <li key={pl.slug} className="premium-catalog-card">
                <p className="font-semibold text-text">{pl.name}</p>
                <p className="text-accent text-sm mt-1">${(pl.price_mxn_cents / 100).toFixed(0)} MXN / mes</p>
                <p className="text-xs text-faint mt-2 font-mono">{pl.slug}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Ejecuta <code className="text-xs">schema-v9-premium.sql</code></p>
        )}
      </section>

      <section className="card-glass p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-text">Insignias ({badges.length})</h2>
        <p className="text-sm text-muted">
          Tabla <code className="text-xs">badges</code>. Desbloqueo: triggers SQL o insert manual en{' '}
          <code className="text-xs">user_badges</code>.
        </p>
        <ul className="premium-catalog-grid">
          {badges.map((b) => (
            <li key={b.slug} className="premium-catalog-card">
              <p className="font-semibold text-sm">🏅 {b.name}</p>
              <p className="text-xs text-muted mt-1">{b.category}</p>
              <p className="text-[10px] text-faint font-mono mt-2">{b.slug}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-glass p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-text">Tienda cosmética ({shop.length})</h2>
        <p className="text-sm text-muted">
          Marcos = <code className="text-xs">item_type: avatar_border</code> + clase CSS en{' '}
          <code className="text-xs">globals.css</code>.
        </p>
        <ul className="space-y-3">
          {shop.map((item) => (
            <li key={item.slug} className="premium-catalog-row">
              <div className={`premium-frame-preview ${item.css_class || ''}`}>
                <span className="w-10 h-10 rounded-full bg-surface-4 block" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-text">{item.name}</p>
                <p className="text-xs text-muted">{item.item_type} · {item.price_coins} 🪙</p>
              </div>
              <code className="text-[10px] text-faint">{item.css_class}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-glass p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-text">Títulos por nivel</h2>
        <ul className="flex flex-wrap gap-2">
          {titles.map((t) => (
            <span key={t.slug} className="tag tag-gold text-xs">
              Nv.{t.min_level} · {t.name}
            </span>
          ))}
        </ul>
      </section>

      <section className="card-glass p-6 prose-news text-sm text-muted space-y-2">
        <h2 className="font-display text-lg font-bold text-text">SQL rápido — nueva insignia</h2>
        <pre className="text-xs bg-surface-3 p-4 rounded-lg overflow-x-auto text-faint">
{`insert into public.badges (slug, name, description, category, icon_url)
values ('mi-logro', 'Mi Logro', 'Descripción.', 'logro', '');`}
        </pre>
        <h2 className="font-display text-lg font-bold text-text pt-4">SQL — nuevo marco</h2>
        <pre className="text-xs bg-surface-3 p-4 rounded-lg overflow-x-auto text-faint">
{`insert into public.shop_items (slug, name, description, price_coins, item_type, css_class)
values ('border-nuevo', 'Marco Nuevo', '...', 120, 'avatar_border', 'cosmetic-border-nuevo');`}
        </pre>
      </section>
    </div>
  )
}
