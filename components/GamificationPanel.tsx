'use client'

import { useEffect, useState } from 'react'
import MeduCoin from './MeduCoin'

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
  asset_url?: string | null
  metadata?: {
    acquisition?: 'purchase' | 'reward' | 'premium' | 'gift'
    unlock_condition?: string
    premium_only?: boolean
    rarity?: string
  }
}

type InventoryRow = {
  equipped: boolean
  shop_items: { slug: string; name: string; item_type: string; css_class: string | null } | null
}

type Title = { slug: string; name: string; min_level: number }

export default function GamificationPanel() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [titles, setTitles] = useState<Title[]>([])
  const [shop, setShop] = useState<ShopItem[]>([])
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [equippedSlug, setEquippedSlug] = useState<string | null>(null)
  const [level, setLevel] = useState(1)
  const [coins, setCoins] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/gamification')
    const data = await res.json()
    setBadges(data.badges || [])
    setTitles(data.titles || [])
    setShop(data.shop || [])
    setInventory(data.inventory || [])
    setEquippedSlug(data.equipped_slug || null)
    setSelectedTitle(data.selected_title || 'Novato')
    setLevel(data.level ?? 1)
    setCoins(data.coins ?? 0)
    setIsPremium(!!data.is_premium)
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

  const equip = async (slug: string) => {
    await fetch('/api/gamification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'equip', slug }),
    })
    await load()
  }

  const claim = async (slug: string) => {
    const res = await fetch('/api/gamification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim', slug }),
    })
    const data = await res.json()
    if (!res.ok) alert(data.error || 'No se pudo reclamar')
    await load()
  }

  // Acción de adquisición según el modo configurado en el CMS
  const acquireAction = (item: ShopItem) => {
    const acq = item.metadata?.acquisition || 'purchase'
    if (acq === 'reward') {
      return (
        <span className="tag tag-gold text-xs">
          🎯 {item.metadata?.unlock_condition || 'Por logro'}
        </span>
      )
    }
    if (acq === 'gift') {
      return <span className="tag text-xs">🎁 Evento / regalo</span>
    }
    if (acq === 'premium') {
      return isPremium ? (
        <button type="button" className="btn-primary text-xs" onClick={() => claim(item.slug)}>
          💎 Reclamar Premium
        </button>
      ) : (
        <span className="tag tag-accent text-xs">💎 Solo Premium</span>
      )
    }
    return (
      <button type="button" className="btn-primary text-xs flex items-center gap-1" onClick={() => buy(item.slug)}>
        <MeduCoin amount={item.price_coins} size={13} />
      </button>
    )
  }

  const ownedSlugs = new Set(inventory.map((i) => i.shop_items?.slug).filter(Boolean))
  const borders = shop.filter((s) => s.item_type === 'avatar_border')
  const stickerPacks = shop.filter((s) => s.item_type === 'sticker_pack')

  if (loading) return <p className="text-sm text-muted">Cargando…</p>

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-display font-semibold text-text mb-3">Insignias y logros</h3>
        {badges.length === 0 ? (
          <p className="text-sm text-muted">Participa en foro, reseñas y listas para desbloquear insignias.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b, i) => (
              <li key={i} className="card-glass p-3">
                <p className="font-semibold text-text text-sm">🏅 {b.badges?.name}</p>
                <p className="text-xs text-muted mt-1">{b.badges?.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-display font-semibold text-text mb-3">Título equipado (nivel {level})</h3>
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
        <h3 className="font-display font-semibold text-text mb-3">Marcos de avatar</h3>
        <p className="text-xs text-muted mb-3">Se ven en el foro y tu perfil público.</p>
        <ul className="space-y-3">
          {borders.map((item) => {
            const owned = ownedSlugs.has(item.slug)
            const equipped = equippedSlug === item.slug
            return (
              <li key={item.slug} className="card-glass p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`forum-author-avatar w-10 h-10 text-sm ${item.css_class || ''}`}>A</span>
                  <div>
                    <p className="font-semibold text-text text-sm">{item.name}</p>
                    <p className="text-xs text-muted">{item.description}</p>
                  </div>
                </div>
                {owned ? (
                  equipped ? (
                    <span className="tag tag-accent text-xs">Equipado</span>
                  ) : (
                    <button type="button" className="btn-ghost text-xs" onClick={() => equip(item.slug)}>
                      Equipar
                    </button>
                  )
                ) : (
                  acquireAction(item)
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h3 className="font-display font-semibold text-text mb-3 flex items-center gap-2">
          Packs de stickers · <MeduCoin amount={coins} size={15} />
        </h3>
        <p className="text-xs text-muted mb-3">Úsalos al escribir en el foro (botón 😀 Stickers).</p>
        <ul className="space-y-3">
          {stickerPacks.map((item) => {
            const owned = ownedSlugs.has(item.slug)
            return (
              <li key={item.slug} className="card-glass p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text text-sm">{item.name}</p>
                  <p className="text-xs text-muted">{item.description}</p>
                </div>
                {owned ? (
                  <span className="tag tag-gold text-xs">Desbloqueado</span>
                ) : (
                  acquireAction(item)
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
