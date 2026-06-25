'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '../ToastProvider'

type StickerMeta = { id: string; emoji?: string; label: string; image?: string }

type ShopItem = {
  id: number
  slug: string
  name: string
  description: string
  price_coins: number
  item_type: string
  css_class: string | null
  asset_url: string | null
  metadata: { stickers?: StickerMeta[] }
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

type StickerRow = { id: string; emoji: string; label: string; image: string }

const BORDER_PRESETS = [
  'cosmetic-border-sakura',
  'cosmetic-border-neon',
  'cosmetic-border-gold',
  'cosmetic-border-holo',
]

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const emptySticker = (): StickerRow => ({ id: '', emoji: '', label: '', image: '' })

export default function AdminRewardsManager() {
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('stickers')
  const [shop, setShop] = useState<ShopItem[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadFolder, setUploadFolder] = useState('stickers')
  const [stickerUploading, setStickerUploading] = useState<number | null>(null)
  const stickerFileRef = useRef<HTMLInputElement>(null)
  const stickerTargetRef = useRef<number | null>(null)

  // ── Generación con IA ──
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiSketchUrl, setAiSketchUrl] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const sketchFileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    slug: '',
    name: '',
    description: '',
    price_coins: 100,
    css_class: 'cosmetic-border-sakura',
    asset_url: '',
    category: 'general',
  })

  const [stickers, setStickers] = useState<StickerRow[]>([
    { id: 'waifu', emoji: '💕', label: 'Waifu', image: '' },
    { id: 'nakama', emoji: '🤝', label: 'Nakama', image: '' },
  ])

  const load = () => {
    fetch('/api/admin/rewards')
      .then((r) => r.json())
      .then((d) => {
        setShop(d.shop || [])
        setBadges(d.badges || [])
        setAiEnabled(!!d.aiEnabled)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm({
      slug: '',
      name: '',
      description: '',
      price_coins: 100,
      css_class: 'cosmetic-border-sakura',
      asset_url: '',
      category: 'general',
    })
    setStickers([emptySticker()])
  }

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

  // ── Stickers visuales ──
  const updateSticker = (index: number, patch: Partial<StickerRow>) =>
    setStickers((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  const addSticker = () => setStickers((rows) => [...rows, emptySticker()])

  const removeSticker = (index: number) =>
    setStickers((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows))

  const uploadStickerImage = async (index: number, file: File) => {
    setStickerUploading(index)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'stickers')
      const res = await fetch('/api/admin/rewards/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateSticker(index, { image: data.url, emoji: '' })
      showToast({ title: 'Emoji listo', description: 'Imagen personalizada subida' })
    } catch (err) {
      showToast({ title: 'Error', description: String(err) })
    } finally {
      setStickerUploading(null)
    }
  }

  const buildStickerMeta = (): StickerMeta[] =>
    stickers
      .map((s) => {
        const label = s.label.trim()
        const id = (s.id.trim() || slugify(label)).trim()
        if (!id || !label || (!s.emoji.trim() && !s.image.trim())) return null
        return {
          id,
          label,
          emoji: s.emoji.trim() || undefined,
          image: s.image.trim() || undefined,
        }
      })
      .filter(Boolean) as StickerMeta[]

  const saveShop = async (itemType: 'sticker_pack' | 'avatar_border') => {
    let metadata = {}
    if (itemType === 'sticker_pack') {
      const list = buildStickerMeta()
      if (list.length === 0) {
        showToast({ title: 'Faltan stickers', description: 'Agrega al menos un sticker con nombre y emoji/imagen' })
        return
      }
      metadata = { stickers: list }
    }
    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'shop_item',
        slug: form.slug || slugify(form.name),
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
        slug: form.slug || slugify(form.name),
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

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast({ title: 'Falta nombre', description: 'Escribe un nombre visible' })
      return
    }
    const action =
      tab === 'badges' ? saveBadge() : saveShop(tab === 'stickers' ? 'sticker_pack' : 'avatar_border')
    action.catch((err) => showToast({ title: 'Error', description: String(err) }))
  }

  // ── IA: subir boceto de referencia (image-to-image) ──
  const uploadSketch = async (file: File) => {
    setAiLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'sketches')
      const res = await fetch('/api/admin/rewards/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiSketchUrl(data.url)
      showToast({ title: 'Boceto listo', description: 'La IA lo usará como base' })
    } catch (err) {
      showToast({ title: 'Error', description: String(err) })
    } finally {
      setAiLoading(false)
    }
  }

  const generateAi = async () => {
    if (aiPrompt.trim().length < 3) {
      showToast({ title: 'Falta descripción', description: 'Describe el diseño que quieres' })
      return
    }
    setAiLoading(true)
    try {
      const type = tab === 'stickers' ? 'sticker' : tab === 'borders' ? 'border' : 'badge'
      const res = await fetch('/api/admin/rewards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, type, sketchUrl: aiSketchUrl || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (tab === 'stickers') {
        setStickers((rows) => [
          ...rows.filter((r) => r.label || r.emoji || r.image),
          {
            id: slugify(aiPrompt).slice(0, 24) || `sticker-${Date.now()}`,
            emoji: '',
            label: aiPrompt.slice(0, 24),
            image: data.url,
          },
        ])
      } else {
        setForm((f) => ({ ...f, asset_url: data.url }))
      }
      showToast({ title: 'Imagen generada', description: 'Lista en la vista previa' })
    } catch (err) {
      showToast({ title: 'Error', description: String(err) })
    } finally {
      setAiLoading(false)
    }
  }

  const aiPresets: Record<Tab, string[]> = {
    stickers: ['gato chibi feliz', 'chica anime guiñando', 'pulgar arriba estilo manga', 'corazón kawaii'],
    borders: ['marco circular sakura dorado', 'borde neón futurista', 'marco con llamas shonen'],
    badges: ['medalla de oro con estrella', 'emblema de dragón', 'insignia rango legendario'],
  }

  const stickerPacks = shop.filter((s) => s.item_type === 'sticker_pack')
  const borders = shop.filter((s) => s.item_type === 'avatar_border')

  const tabMeta: Record<Tab, { title: string; help: string }> = {
    stickers: {
      title: 'Pack de stickers / emojis',
      help: 'Crea un pack con emojis o imágenes personalizadas. Cada sticker se usa en el foro con :id:.',
    },
    borders: { title: 'Marco de avatar', help: 'Define un marco con una clase CSS o sube una imagen de borde.' },
    badges: { title: 'Insignia', help: 'Sube un icono y asígnale una categoría.' },
  }

  return (
    <div className="admin-page space-y-6">
      <header>
        <p className="eyebrow mb-1">Premios</p>
        <h1 className="page-title">Stickers · Marcos · Insignias</h1>
        <p className="text-sm text-muted mt-2">
          Crea premios subiendo imágenes o definiendo emojis — sin IA, costo $0. Requiere schema-v17 y el
          bucket <code className="text-xs">rewards</code> en Storage.
        </p>
      </header>

      <div className="admin-reward-tabs">
        {(
          [
            ['stickers', '😀 Stickers / Emojis'],
            ['borders', '🖼️ Marcos'],
            ['badges', '🏅 Insignias'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id)
              setUploadFolder(id === 'badges' ? 'badges' : id)
            }}
            className={`admin-reward-tab${tab === id ? ' is-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-reward-grid">
        <section className="card-glass p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-semibold text-text">{tabMeta[tab].title}</h2>
            <button type="button" className="btn-ghost text-[11px]" onClick={resetForm}>
              Limpiar
            </button>
          </div>
          <p className="text-xs text-muted">{tabMeta[tab].help}</p>

          <label className="admin-field">
            <span className="admin-field-label">Nombre visible</span>
            <input
              className="input w-full text-sm"
              placeholder="Ej. Pack Otaku"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="admin-field">
            <span className="admin-field-label">
              Slug único <span className="text-faint">(opcional, se genera del nombre)</span>
            </span>
            <input
              className="input w-full text-sm"
              placeholder={form.name ? slugify(form.name) : 'slug-unico'}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>

          <label className="admin-field">
            <span className="admin-field-label">Descripción</span>
            <textarea
              className="input w-full text-sm"
              rows={2}
              placeholder="Breve descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          {tab !== 'badges' ? (
            <label className="admin-field">
              <span className="admin-field-label">Precio en monedas</span>
              <input
                type="number"
                className="input w-full text-sm"
                value={form.price_coins}
                onChange={(e) => setForm({ ...form, price_coins: Number(e.target.value) })}
              />
            </label>
          ) : (
            <label className="admin-field">
              <span className="admin-field-label">Categoría</span>
              <input
                className="input w-full text-sm"
                placeholder="forum, social, premium…"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </label>
          )}

          {tab === 'borders' ? (
            <label className="admin-field">
              <span className="admin-field-label">Clase CSS del marco</span>
              <input
                className="input w-full text-sm"
                placeholder="cosmetic-border-sakura"
                value={form.css_class}
                onChange={(e) => setForm({ ...form, css_class: e.target.value })}
                list="border-presets"
              />
              <datalist id="border-presets">
                {BORDER_PRESETS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </label>
          ) : null}

          {tab === 'stickers' ? (
            <div className="admin-field">
              <div className="flex items-center justify-between">
                <span className="admin-field-label">Stickers del pack</span>
                <button type="button" className="btn-ghost text-[11px]" onClick={addSticker}>
                  + Añadir
                </button>
              </div>
              <div className="space-y-2">
                {stickers.map((s, i) => (
                  <div key={i} className="admin-sticker-row">
                    <div className="admin-sticker-glyph">
                      {s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt="" />
                      ) : (
                        <span>{s.emoji || '∅'}</span>
                      )}
                    </div>
                    <div className="admin-sticker-fields">
                      <input
                        className="input text-sm admin-sticker-emoji"
                        placeholder="😀"
                        maxLength={4}
                        value={s.emoji}
                        onChange={(e) => updateSticker(i, { emoji: e.target.value, image: '' })}
                      />
                      <input
                        className="input text-sm"
                        placeholder="Nombre"
                        value={s.label}
                        onChange={(e) =>
                          updateSticker(i, {
                            label: e.target.value,
                            id: s.id || slugify(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="admin-sticker-actions">
                      <button
                        type="button"
                        className="btn-ghost text-[10px] px-2"
                        disabled={stickerUploading === i}
                        onClick={() => {
                          stickerTargetRef.current = i
                          stickerFileRef.current?.click()
                        }}
                        title="Subir emoji personalizado"
                      >
                        {stickerUploading === i ? '…' : 'IMG'}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-[10px] px-2"
                        onClick={() => removeSticker(i)}
                        title="Quitar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <input
                ref={stickerFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  const idx = stickerTargetRef.current
                  if (f && idx !== null) uploadStickerImage(idx, f)
                  e.target.value = ''
                }}
              />
            </div>
          ) : null}

          {tab !== 'stickers' ? (
            <div className="admin-field">
              <span className="admin-field-label">
                {tab === 'badges' ? 'Icono de la insignia' : 'Imagen del marco (opcional)'}
              </span>
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
                {form.asset_url ? <span className="text-[10px] text-faint">✓ imagen cargada</span> : null}
              </div>
            </div>
          ) : null}

          {aiEnabled ? (
            <div className="admin-ai-box">
              <div className="flex items-center justify-between gap-2">
                <span className="admin-field-label mb-0">✨ Generar con IA</span>
                <span className="text-[10px] text-faint">flux · ~$0.003/img</span>
              </div>
              <textarea
                className="input w-full text-sm"
                rows={2}
                placeholder={
                  tab === 'badges'
                    ? 'Ej. medalla de oro con una estrella'
                    : tab === 'borders'
                      ? 'Ej. marco circular con pétalos de sakura'
                      : 'Ej. gato chibi saludando feliz'
                }
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5">
                {aiPresets[tab].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="admin-ai-chip"
                    onClick={() => setAiPrompt(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                ref={sketchFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) uploadSketch(f)
                  e.target.value = ''
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost text-[11px]"
                  disabled={aiLoading}
                  onClick={() => sketchFileRef.current?.click()}
                >
                  {aiSketchUrl ? '✓ Boceto base' : 'Subir boceto (opcional)'}
                </button>
                {aiSketchUrl ? (
                  <button
                    type="button"
                    className="text-[10px] text-faint underline"
                    onClick={() => setAiSketchUrl('')}
                  >
                    quitar
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="btn-primary text-sm w-full"
                disabled={aiLoading}
                onClick={generateAi}
              >
                {aiLoading ? 'Generando…' : 'Generar imagen'}
              </button>
              <p className="text-[10px] text-faint">
                {tab === 'stickers'
                  ? 'Se añade como nuevo sticker con imagen.'
                  : 'Reemplaza la imagen del premio actual.'}
              </p>
            </div>
          ) : null}

          <button type="button" className="btn-primary text-sm w-full" onClick={handleSave}>
            Guardar en catálogo
          </button>
        </section>

        <section className="card-glass p-4 sm:p-6 space-y-4 admin-reward-preview">
          <h2 className="font-display font-semibold text-text">Vista previa</h2>

          {tab === 'borders' && (
            <div className="flex justify-center py-6">
              <div className={`profile-avatar-ring ${form.css_class}`}>
                <span className="profile-avatar">A</span>
              </div>
            </div>
          )}

          {tab === 'stickers' && (
            <div className="space-y-3">
              <p className="text-xs text-faint">{form.name || 'Pack sin nombre'}</p>
              <div className="flex flex-wrap gap-3">
                {buildStickerMeta().length === 0 ? (
                  <p className="text-xs text-faint">Agrega stickers para previsualizarlos.</p>
                ) : (
                  buildStickerMeta().map((s) => (
                    <span key={s.id} className="admin-sticker-preview" title={s.label}>
                      {s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt={s.label} />
                      ) : (
                        <span className="text-2xl">{s.emoji}</span>
                      )}
                      <span className="admin-sticker-preview-label">:{s.id}:</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'badges' && form.asset_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.asset_url} alt="" className="w-24 h-24 object-contain mx-auto" />
          ) : tab === 'badges' ? (
            <p className="text-xs text-faint text-center py-6">Sube un icono para la insignia</p>
          ) : null}

          {form.asset_url && tab === 'borders' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.asset_url} alt="" className="max-h-32 mx-auto rounded-lg object-contain" />
          ) : null}
        </section>
      </div>

      {!loading && (
        <section className="card-glass p-4 sm:p-6">
          <h2 className="font-display font-semibold text-text mb-4">Catálogo actual</h2>
          {tab === 'stickers' && (
            <ul className="space-y-2 text-sm">
              {stickerPacks.length === 0 ? (
                <li className="text-xs text-faint">Aún no hay packs.</li>
              ) : (
                stickerPacks.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2 border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2">
                      {s.name}
                      <span className="text-faint text-xs">
                        {(s.metadata?.stickers?.length || 0)} stickers
                      </span>
                    </span>
                    <span className="text-faint">{s.price_coins} 🪙</span>
                  </li>
                ))
              )}
            </ul>
          )}
          {tab === 'borders' && (
            <ul className="space-y-2 text-sm">
              {borders.length === 0 ? (
                <li className="text-xs text-faint">Aún no hay marcos.</li>
              ) : (
                borders.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <span>{s.name}</span>
                    <code className="text-[10px] text-faint">{s.css_class}</code>
                  </li>
                ))
              )}
            </ul>
          )}
          {tab === 'badges' && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.length === 0 ? (
                <li className="text-xs text-faint">Aún no hay insignias.</li>
              ) : (
                badges.map((b) => (
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
                ))
              )}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
