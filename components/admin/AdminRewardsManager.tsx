'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '../ToastProvider'

type ShopItem = {
  id: number
  slug: string
  name: string
  description: string
  price_coins: number
  item_type: string
  css_class: string | null
  asset_url: string | null
  metadata: { stickers?: { id: string; emoji: string; label: string }[] }
}

type Badge = {
  id: number
  slug: string
  name: string
  description: string
  category: string
  icon_url: string | null
  is_active: boolean
}

type Tab = 'stickers' | 'borders' | 'badges'

export default function AdminRewardsManager() {
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('stickers')
  const [shop, setShop] = useState<ShopItem[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadFolder, setUploadFolder] = useState('stickers')

  const [form, setForm] = useState({
    slug: '',
    name: '',
    description: '',
    price_coins: 100,
    css_class: 'cosmetic-border-sakura',
    asset_url: '',
    category: 'general',
    stickers_json:
      '[{"id":"waifu","emoji":"💕","label":"Waifu"},{"id":"nakama","emoji":"🤝","label":"Nakama"}]',
  })

  const load = () => {
    fetch('/api/admin/rewards')
      .then((r) => r.json())
      .then((d) => {
        setShop(d.shop || [])
        setBadges(d.badges || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const upload = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', uploadFolder)
    const res = await fetch('/api/admin/rewards/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setForm((f) => ({ ...f, asset_url: data.url }))
    showToast({ title: 'Subida OK', description: 'Imagen lista para el premio' })
  }

  const saveShop = async (itemType: 'sticker_pack' | 'avatar_border') => {
    let metadata = {}
    if (itemType === 'sticker_pack') {
      try {
        metadata = { stickers: JSON.parse(form.stickers_json) }
      } catch {
        showToast({ title: 'JSON inválido', description: 'Revisa el formato de stickers' })
        return
      }
    }
    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'shop_item',
        slug: form.slug,
        name: form.name,
        description: form.description,
        price_coins: form.price_coins,
        item_type: itemType,
        css_class: itemType === 'avatar_border' ? form.css_class : null,
        asset_url: form.asset_url,
        metadata,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    showToast({ title: 'Guardado', description: form.name })
    load()
  }

  const saveBadge = async () => {
    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'badge',
        slug: form.slug,
        name: form.name,
        description: form.description,
        category: form.category,
        icon_url: form.asset_url,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    showToast({ title: 'Insignia guardada', description: form.name })
    load()
  }

  const stickerPacks = shop.filter((s) => s.item_type === 'sticker_pack')
  const borders = shop.filter((s) => s.item_type === 'avatar_border')

  return (
    <div className="admin-page space-y-8">
      <header>
        <p className="eyebrow mb-1">Premios</p>
        <h1 className="page-title">Stickers · Marcos · Insignias</h1>
        <p className="text-sm text-muted mt-2">
          Crea premios subiendo imágenes o definiendo emojis — sin IA, costo $0. Ejecuta schema-v17 y crea bucket{' '}
          <code className="text-xs">rewards</code> en Storage.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['stickers', 'Packs stickers'],
            ['borders', 'Marcos'],
            ['badges', 'Insignias'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`btn-ghost text-xs${tab === id ? ' border-accent text-accent' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="card-glass p-6 space-y-4">
          <h2 className="font-display font-semibold text-text">Crear / actualizar</h2>
          <input
            className="input w-full text-sm"
            placeholder="slug-unico"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <input
            className="input w-full text-sm"
            placeholder="Nombre visible"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            className="input w-full text-sm"
            rows={2}
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {tab !== 'badges' ? (
            <input
              type="number"
              className="input w-full text-sm"
              placeholder="Precio monedas"
              value={form.price_coins}
              onChange={(e) => setForm({ ...form, price_coins: Number(e.target.value) })}
            />
          ) : (
            <input
              className="input w-full text-sm"
              placeholder="Categoría (forum, social, premium…)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          )}
          {tab === 'borders' ? (
            <input
              className="input w-full text-sm"
              placeholder="Clase CSS (cosmetic-border-sakura)"
              value={form.css_class}
              onChange={(e) => setForm({ ...form, css_class: e.target.value })}
            />
          ) : null}
          {tab === 'stickers' ? (
            <textarea
              className="input w-full text-sm font-mono text-xs"
              rows={5}
              value={form.stickers_json}
              onChange={(e) => setForm({ ...form, stickers_json: e.target.value })}
            />
          ) : null}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload(f).catch((err) => showToast({ title: 'Error', description: String(err) }))
              }}
            />
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => {
                setUploadFolder(tab === 'badges' ? 'badges' : tab)
                fileRef.current?.click()
              }}
            >
              Subir imagen
            </button>
            {form.asset_url ? (
              <span className="text-[10px] text-faint truncate max-w-[200px]">✓ imagen</span>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => {
              const action =
                tab === 'badges' ? saveBadge() : saveShop(tab === 'stickers' ? 'sticker_pack' : 'avatar_border')
              action.catch((err) => showToast({ title: 'Error', description: String(err) }))
            }}
          >
            Guardar en catálogo
          </button>
        </section>

        <section className="card-glass p-6 space-y-4">
          <h2 className="font-display font-semibold text-text">Vista previa</h2>
          {tab === 'borders' && (
            <div className="flex justify-center py-6">
              <div className={`profile-avatar-ring ${form.css_class}`}>
                <span className="profile-avatar">A</span>
              </div>
            </div>
          )}
          {tab === 'stickers' && (
            <div className="flex flex-wrap gap-2">
              {(() => {
                try {
                  return (JSON.parse(form.stickers_json || '[]') as { emoji: string; label: string }[]).map(
                    (s, i) => (
                      <span key={i} className="forum-sticker text-2xl" title={s.label}>
                        {s.emoji}
                      </span>
                    ),
                  )
                } catch {
                  return <p className="text-xs text-sakura">JSON de stickers inválido</p>
                }
              })()}
            </div>
          )}
          {tab === 'badges' && form.asset_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.asset_url} alt="" className="w-24 h-24 object-contain mx-auto" />
          ) : tab === 'badges' ? (
            <p className="text-xs text-faint text-center">Sube un icono para la insignia</p>
          ) : null}
          {form.asset_url && tab !== 'badges' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.asset_url} alt="" className="max-h-32 mx-auto rounded-lg object-contain" />
          ) : null}
        </section>
      </div>

      {!loading && (
        <section className="card-glass p-6">
          <h2 className="font-display font-semibold text-text mb-4">Catálogo actual</h2>
          {tab === 'stickers' && (
            <ul className="space-y-2 text-sm">
              {stickerPacks.map((s) => (
                <li key={s.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                  <span>{s.name}</span>
                  <span className="text-faint">{s.price_coins} 🪙</span>
                </li>
              ))}
            </ul>
          )}
          {tab === 'borders' && (
            <ul className="space-y-2 text-sm">
              {borders.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span>{s.name}</span>
                  <code className="text-[10px] text-faint">{s.css_class}</code>
                </li>
              ))}
            </ul>
          )}
          {tab === 'badges' && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((b) => (
                <li key={b.id} className="rounded-lg border border-white/8 p-3 text-center">
                  {b.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.icon_url} alt="" className="w-12 h-12 mx-auto object-contain mb-2" />
                  ) : (
                    <span className="text-2xl">🏅</span>
                  )}
                  <p className="text-xs font-semibold">{b.name}</p>
                  <p className="text-[10px] text-faint">{b.category}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
