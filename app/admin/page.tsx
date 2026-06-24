import Link from 'next/link'
import { formatMxn, getAdminDashboardStats } from '../../lib/admin/stats'

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats()
  const balance = stats.income_mxn_cents - stats.expenses_mxn_cents

  const cards = [
    {
      label: 'Reseñas pendientes',
      value: stats.pending_editorial + stats.pending_ugc,
      hint: `${stats.pending_editorial} editorial · ${stats.pending_ugc} usuarios`,
      href: '/admin/resenas',
    },
    {
      label: 'Aportes pendientes',
      value: stats.pending_aportes,
      href: '/admin/aportes',
    },
    {
      label: 'Usuarios',
      value: stats.total_users,
      hint: `${stats.premium_users} premium`,
      href: '/admin/usuarios',
    },
    {
      label: 'Premios en tienda',
      value: stats.shop_items,
      hint: `${stats.badges} insignias`,
      href: '/admin/premios',
    },
  ]

  return (
    <div className="admin-page space-y-8 enter-up">
      <header>
        <p className="eyebrow mb-1">Aniministrador</p>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-muted mt-2">
          Vista general de moderación, premios y finanzas. Sin generación IA automática — premios por subida manual.
        </p>
      </header>

      <div className="admin-stat-grid">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="admin-stat-card card-glass">
            <p className="admin-stat-label">{c.label}</p>
            <p className="admin-stat-value">{c.value}</p>
            {c.hint ? <p className="text-xs text-faint mt-1">{c.hint}</p> : null}
          </Link>
        ))}
      </div>

      <section className="card-glass p-6">
        <h2 className="font-display font-semibold text-text mb-4">Finanzas (resumen)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="admin-finance-pill">
            <p className="text-xs text-faint">Ingresos (pagos)</p>
            <p className="text-lg font-bold text-emerald-400">{formatMxn(stats.income_mxn_cents)}</p>
          </div>
          <div className="admin-finance-pill">
            <p className="text-xs text-faint">Gastos registrados</p>
            <p className="text-lg font-bold text-sakura">{formatMxn(stats.expenses_mxn_cents)}</p>
          </div>
          <div className="admin-finance-pill">
            <p className="text-xs text-faint">Balance estimado</p>
            <p className="text-lg font-bold text-text">{formatMxn(balance)}</p>
          </div>
        </div>
        <Link href="/admin/finanzas" className="text-xs text-accent hover:underline mt-4 inline-block">
          Ver detalle financiero →
        </Link>
      </section>

      <section className="card-glass p-6">
        <h2 className="font-display font-semibold text-text mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/resenas" className="btn-primary text-xs">
            Moderar reseñas
          </Link>
          <Link href="/admin/premios" className="btn-ghost text-xs">
            Gestionar premios
          </Link>
          <Link href="/admin/calendario" className="btn-ghost text-xs">
            Calendario editorial
          </Link>
          <Link href="/perfil" className="btn-ghost text-xs">
            Mi perfil
          </Link>
        </div>
      </section>

      {stats.recent_events.length > 0 ? (
        <section className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-3">Últimos eventos de pago</h2>
          <ul className="space-y-2 text-sm">
            {stats.recent_events.map((e) => (
              <li key={e.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                <span className="text-muted">
                  {e.provider} · {e.status}
                </span>
                <span className="text-text font-medium">
                  {e.amount_mxn_cents != null ? formatMxn(e.amount_mxn_cents) : '—'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-muted card-glass p-5">
          Aún no hay pagos registrados. Cuando actives Stripe o Mercado Pago, los eventos aparecerán aquí.
        </p>
      )}
    </div>
  )
}
