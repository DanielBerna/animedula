'use client'

import { useEffect, useState } from 'react'

type Badge = {
  unlocked_at: string
  badges: { slug: string; name: string; description: string; category: string } | null
}

type ShopItem = {
  id: number
  slug: string
  name: string
  description: string
  price_coins: number
  item_type: string
  css_class: string | null
}

type Title = { slug: string; name: string; min_level: number }

export default function GamificationPanel() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [titles, setTitles] = useState<Title[]>([])
  const [shop, setShop] = useState<ShopItem[]>([])
  const [inventory, setInventory] = useState<string[]>([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [level, setLevel] = useState(1)
  const [coins, setCoins] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/gamification')
    const data = await res.json()
    setBadges(data.badges || [])
    setTitles(data.titles || [])
    setShop(data.shop || [])
    setSelectedTitle(data.selected_title || 'Novato')
    setLevel(data.level ?? 1)
    setCoins(data.coins ?? 0)
    setInventory(
      (data.inventory || [])
        .map((i: { shop_items?: { slug: string } | null }) => i.shop_items?.slug)
        .filter(Boolean) as string[],
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const selectTitle = async (slug: string) => {
    await fetch('/api/gamification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'select_title', slug }),
    })
    await load()
  }

  const buy = async (slug: string) => {
    const res = await fetch('/api/gamification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'buy', slug }),
    })
    const data = await res.json()
    if (!res.ok) alert(data.error || 'No se pudo comprar')
    await load()
  }

  if (loading) return <p className="text-sm text-muted">Cargando…</p>

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-display font-semibold text-text mb-3">Insignias</h3>
        {badges.length === 0 ? (
          <p className="text-sm text-muted">Aún no tienes insignias. Participa para desbloquearlas.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b, i) => (
              <li key={i} className="card-glass p-3">
                <p className="font-semibold text-text text-sm">{b.badges?.name}</p>
                <p className="text-xs text-muted mt-1">{b.badges?.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-display font-semibold text-text mb-3">Título (nivel {level})</h3>
        <div className="flex flex-wrap gap-2">
          {titles.map((t) => (
            <button
              key={t.slug}
              type="button"
              className={`track-list-chip${selectedTitle === t.name ? ' is-active' : ''}`}
              onClick={() => selectTitle(t.slug)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display font-semibold text-text mb-3">Tienda Animédula · 🪙 {coins}</h3>
        <ul className="space-y-3">
          {shop.map((item) => {
            const owned = inventory.includes(item.slug)
            return (
              <li key={item.slug} className="card-glass p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text text-sm">{item.name}</p>
                  <p className="text-xs text-muted">{item.description}</p>
                </div>
                {owned ? (
                  <span className="tag text-xs">En tu inventario</span>
                ) : (
                  <button type="button" className="btn-primary text-xs" onClick={() => buy(item.slug)}>
                    Comprar · {item.price_coins} 🪙
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
