import { PREMIUM_PERKS } from '../lib/premium'

export default function PremiumUpsell() {
  return (
    <section className="premium-upsell card-glass p-6 space-y-4">
      <div>
        <p className="premium-eyebrow">Próximamente</p>
        <h2 className="font-display text-xl font-bold text-text">Animédula+</h2>
        <p className="text-sm text-muted mt-2">
          Suscripción mensual (~$79 MXN). Pagos con Stripe o Mercado Pago — ver{' '}
          <code className="text-xs">docs/GUIA-IMPLEMENTACION.md</code>.
        </p>
      </div>
      <ul className="premium-perks-grid">
        {PREMIUM_PERKS.map((p) => (
          <li key={p.title} className="premium-perk-card">
            <span className="premium-perk-icon">{p.icon}</span>
            <div>
              <p className="font-semibold text-sm text-text">{p.title}</p>
              <p className="text-xs text-muted">{p.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-primary w-full opacity-60 cursor-not-allowed" disabled>
        Activar premium (en desarrollo)
      </button>
    </section>
  )
}
