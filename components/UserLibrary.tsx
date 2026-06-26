'use client'

import { useEffect, useState } from 'react'
import MeduCoin from './MeduCoin'
import AvatarFrame from './AvatarFrame'
import { useToast } from './ToastProvider'

type Acquisition = 'free' | 'purchase' | 'reward' | 'premium' | 'gift'

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
    acquisition?: Acquisition
    unlock_condition?: string
    premium_only?: boolean
    rarity?: string
    border_style?: 'css' | 'image'
    stickers?: { id: string; emoji?: string; image?: string; label: string }[]
  }
}

type InventoryRow = {
  equipped: boolean
  shop_items: { slug: string; name: string; item_type: string; css_class: string | null } | null
}

type Badge = {
  unlocked_at: string
  badges: { slug: string; name: string; description: string; category: string } | null
}

type Title = { slug: string; name: string; min_level: number }

type Tab = 'marcos' | 'stickers' | 'insignias' | 'titulos'

type Border = { cssClass?: string | null; image?: string | null }

function itemBorder(item: ShopItem): Border {
  const isImage = item.metadata?.border_style === 'image' || (!!item.asset_url && !item.css_class)
  return isImage && item.asset_url ? { image: item.asset_url } : { cssClass: item.css_class }
}

export default function UserLibrary({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null
  displayName: string
}) {
  const [tab, setTab] = useState<Tab>('marcos')
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
  const [busy, setBusy] = useState<string | null>(null)
  const { showToast } = useToast()

  const load = async () => {
    const res = await fetch('/api/gamification', { cache: 'no-store' })
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

  const act = async (body: Record<string, unknown>, key: string, okMsg?: string) => {
    setBusy(key)
    try {
      const res = await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast({ title: 'No se pudo completar', description: data.error || 'Intenta de nuevo.' })
      } else if (okMsg) {
        showToast({ title: okMsg, description: 'Disponible en tu biblioteca.' })
      }
      await load()
    } finally {
      setBusy(null)
    }
  }

  const buy = (slug: string) => act({ action: 'buy', slug }, `buy-${slug}`, '¡Comprado!')
  const claim = (slug: string) => act({ action: 'claim', slug }, `claim-${slug}`, '¡Obtenido!')
  const equip = (slug: string) => act({ action: 'equip', slug }, `equip-${slug}`, 'Equipado')
  const selectTitle = (slug: string) => act({ action: 'select_title', slug }, `title-${slug}`)

  // El join de Supabase puede venir como objeto o como array según el esquema.
  const invShop = (i: InventoryRow) =>
    (Array.isArray(i.shop_items) ? i.shop_items[0] : i.shop_items) as InventoryRow['shop_items']
  const ownedSlugs = new Set(inventory.map((i) => invShop(i)?.slug).filter(Boolean))
  const borders = shop.filter((s) => s.item_type === 'avatar_border')
  const stickerPacks = shop.filter((s) => s.item_type === 'sticker_pack')

  // Botón/etiqueta según el modo de obtención del CMS
  const acquireAction = (item: ShopItem) => {
    const acq = item.metadata?.acquisition || 'purchase'
    if (acq === 'free') {
      return (
        <button type="button" className="btn-primary text-xs" disabled={busy === `claim-${item.slug}`} onClick={() => claim(item.slug)}>
          🆓 Obtener gratis
        </button>
      )
    }
    if (acq === 'reward') {
      return <span className="tag tag-gold text-xs">🎯 {item.metadata?.unlock_condition || 'Por logro'}</span>
    }
    if (acq === 'gift') return <span className="tag text-xs">🎁 Evento / regalo</span>
    if (acq === 'premium') {
      return isPremium ? (
        <button type="button" className="btn-primary text-xs" disabled={busy === `claim-${item.slug}`} onClick={() => claim(item.slug)}>
          💎 Reclamar Premium
        </button>
      ) : (
        <span className="tag tag-accent text-xs">💎 Solo Premium</span>
      )
    }
    return (
      <button type="button" className="btn-primary text-xs flex items-center gap-1" disabled={busy === `buy-${item.slug}`} onClick={() => buy(item.slug)}>
        Comprar · <MeduCoin amount={item.price_coins} size={13} />
      </button>
    )
  }

  if (loading) return <p className="text-sm text-muted">Cargando tu biblioteca…</p>

  const ownedBorders = borders.filter((b) => ownedSlugs.has(b.slug))
  const storeBorders = borders.filter((b) => !ownedSlugs.has(b.slug))
  const ownedPacks = stickerPacks.filter((s) => ownedSlugs.has(s.slug))
  const storePacks = stickerPacks.filter((s) => !ownedSlugs.has(s.slug))

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'marcos', label: '🖼️ Marcos', count: ownedBorders.length },
    { id: 'stickers', label: '😀 Stickers', count: ownedPacks.length },
    { id: 'insignias', label: '🏅 Insignias', count: badges.length },
    { id: 'titulos', label: '🎖️ Títulos', count: titles.length },
  ]

  return (
    <div className="space-y-6">
      {/* Cabecera con resumen del usuario */}
      <header className="card-glass p-5 flex flex-wrap items-center gap-4">
        <AvatarFrame
          avatarUrl={avatarUrl}
          label={displayName}
          border={
            equippedSlug
              ? itemBorder(borders.find((b) => b.slug === equippedSlug) || ({} as ShopItem))
              : null
          }
          size={64}
        />
        <div className="min-w-0">
          <p className="eyebrow mb-0.5">Mi biblioteca</p>
          <h1 className="page-title leading-tight">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
            <span className="text-muted">Nivel {level}</span>
            <span className="flex items-center gap-1">
              <MeduCoin amount={coins} size={15} /> <span className="text-muted">MéduCoins</span>
            </span>
            {isPremium ? <span className="tag tag-gold text-xs">Animédula+</span> : null}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="lib-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`lib-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="lib-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Marcos ── */}
      {tab === 'marcos' && (
        <div className="space-y-6">
          <section>
            <h2 className="lib-section-title">Mis marcos ({ownedBorders.length})</h2>
            {ownedBorders.length === 0 ? (
              <p className="text-sm text-muted">Aún no tienes marcos. Consíguelos en la tienda abajo.</p>
            ) : (
              <ul className="lib-grid">
                {ownedBorders.map((item) => {
                  const equipped = equippedSlug === item.slug
                  return (
                    <li key={item.slug} className="lib-card">
                      <AvatarFrame avatarUrl={avatarUrl} label={displayName} border={itemBorder(item)} size={56} className="lib-card-avatar" />
                      <div className="lib-card-body">
                        <p className="lib-card-name">{item.name}</p>
                        <p className="lib-card-desc">{item.description}</p>
                      </div>
                      {equipped ? (
                        <span className="tag tag-accent text-xs">✓ Equipado</span>
                      ) : (
                        <button type="button" className="btn-ghost text-xs" disabled={busy === `equip-${item.slug}`} onClick={() => equip(item.slug)}>
                          Equipar
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="lib-section-title">Tienda de marcos ({storeBorders.length})</h2>
            <p className="text-xs text-muted mb-3">Los marcos se ven en tu avatar en el foro, perfil y todo el sitio.</p>
            {storeBorders.length === 0 ? (
              <p className="text-sm text-muted">¡Ya tienes todos los marcos disponibles!</p>
            ) : (
              <ul className="lib-grid">
                {storeBorders.map((item) => (
                  <li key={item.slug} className="lib-card">
                    <AvatarFrame avatarUrl={avatarUrl} label={displayName} border={itemBorder(item)} size={56} className="lib-card-avatar" />
                    <div className="lib-card-body">
                      <p className="lib-card-name">{item.name}</p>
                      <p className="lib-card-desc">{item.description}</p>
                    </div>
                    {acquireAction(item)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* ── Stickers ── */}
      {tab === 'stickers' && (
        <div className="space-y-6">
          <section>
            <h2 className="lib-section-title">Mis packs ({ownedPacks.length})</h2>
            {ownedPacks.length === 0 ? (
              <p className="text-sm text-muted">Aún no tienes packs de stickers.</p>
            ) : (
              <ul className="lib-grid">
                {ownedPacks.map((item) => (
                  <li key={item.slug} className="lib-card">
                    <div className="lib-card-body">
                      <p className="lib-card-name">{item.name}</p>
                      <p className="lib-card-desc">{item.description}</p>
                      <div className="lib-stickers">
                        {(item.metadata?.stickers || []).slice(0, 8).map((st, i) => (
                          <span key={i} className="lib-sticker" title={st.label}>
                            {st.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={st.image} alt="" />
                            ) : (
                              st.emoji
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="tag tag-gold text-xs">Desbloqueado</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="lib-section-title">Tienda de stickers ({storePacks.length})</h2>
            <p className="text-xs text-muted mb-3">Úsalos al escribir en el foro con el botón 😀 Stickers.</p>
            {storePacks.length === 0 ? (
              <p className="text-sm text-muted">¡Ya tienes todos los packs!</p>
            ) : (
              <ul className="lib-grid">
                {storePacks.map((item) => (
                  <li key={item.slug} className="lib-card">
                    <div className="lib-card-body">
                      <p className="lib-card-name">{item.name}</p>
                      <p className="lib-card-desc">{item.description}</p>
                      <div className="lib-stickers">
                        {(item.metadata?.stickers || []).slice(0, 8).map((st, i) => (
                          <span key={i} className="lib-sticker" title={st.label}>
                            {st.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={st.image} alt="" />
                            ) : (
                              st.emoji
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    {acquireAction(item)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* ── Insignias ── */}
      {tab === 'insignias' && (
        <section>
          <h2 className="lib-section-title">Insignias obtenidas ({badges.length})</h2>
          {badges.length === 0 ? (
            <p className="text-sm text-muted">Participa en foro, reseñas y listas para desbloquear insignias.</p>
          ) : (
            <ul className="lib-grid">
              {badges.map((b, i) => (
                <li key={i} className="lib-card">
                  <span className="lib-badge-icon">🏅</span>
                  <div className="lib-card-body">
                    <p className="lib-card-name">{b.badges?.name}</p>
                    <p className="lib-card-desc">{b.badges?.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Títulos ── */}
      {tab === 'titulos' && (
        <section>
          <h2 className="lib-section-title">Títulos (nivel {level})</h2>
          <p className="text-xs text-muted mb-3">Elige el título que se muestra junto a tu nombre.</p>
          <div className="flex flex-wrap gap-2">
            {titles.map((t) => (
              <button
                key={t.slug}
                type="button"
                className={`track-list-chip${selectedTitle === t.name ? ' is-active' : ''}`}
                disabled={busy === `title-${t.slug}`}
                onClick={() => selectTitle(t.slug)}
              >
                {t.name}
                {level < t.min_level ? <span className="text-faint text-[10px] ml-1">(Nv {t.min_level})</span> : null}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
