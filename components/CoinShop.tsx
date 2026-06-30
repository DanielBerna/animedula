'use client'

import MeduCoin from './MeduCoin'
import { COIN_PACKS, formatMxn } from '../lib/gamification/coin-packs'
import { useToast } from './ToastProvider'

export default function CoinShop() {
  const { showToast } = useToast()

  const notReady = () =>
    showToast({
      title: 'Pagos en camino',
      description: 'La compra de MéduCoins estará disponible muy pronto. Por ahora gánalas con misiones y actividad.',
    })

  return (
    <section className="card-glass p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="eyebrow mb-0.5">Tienda</p>
          <h2 className="font-display font-semibold text-text flex items-center gap-2">
            <MeduCoin size={18} /> Comprar MéduCoins
          </h2>
        </div>
        <span className="tag tag-gold text-[10px]">Próximamente</span>
      </div>

      <div className="coin-pack-grid">
        {COIN_PACKS.map((p) => (
          <div key={p.id} className={`coin-pack${p.popular ? ' is-popular' : ''}`}>
            {p.popular ? <span className="coin-pack-badge">Popular</span> : null}
            <div className="coin-pack-amount">
              <MeduCoin amount={p.coins} size={20} />
            </div>
            {p.bonus ? <span className="coin-pack-bonus">+{p.bonus} de regalo</span> : null}
            {p.tagline ? <span className="coin-pack-tagline">{p.tagline}</span> : null}
            <button type="button" className="btn-primary text-xs w-full mt-2" onClick={notReady}>
              {formatMxn(p.price_mxn)}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-faint">
        Las MéduCoins son moneda virtual del sitio para cosméticos. Mientras habilitamos los pagos,
        puedes ganarlas gratis con tus misiones diarias y tu actividad (comentar, reseñar, foro, listas).
      </p>
    </section>
  )
}
