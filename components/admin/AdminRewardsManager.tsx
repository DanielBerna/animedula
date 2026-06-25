'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '../ToastProvider'
import MeduCoin from '../MeduCoin'
import {
  BADGE_CATEGORIES,
  BADGE_TEMPLATES,
  BORDER_PRESETS,
  RARITIES,
  STICKER_TEMPLATES,
  rarityById,
  type Rarity,
} from '../../lib/admin/rewards-catalog'
import {
  ACQUISITIONS,
  UNLOCK_ACTIVITIES,
  acquisitionById,
  type Acquisition,
} from '../../lib/economy'

type StickerMeta = { id: string; emoji?: string; label: string; image?: string }

type RewardMeta = {
  stickers?: StickerMeta[]
  rarity?: Rarity
  acquisition?: Acquisition
  unlock_condition?: string
  premium_only?: boolean
  active?: boolean
  emoji?: string
}

type ShopItem = {
  id: number
  slug: string
  name: string
  description: string
  price_coins: number
  item_type: string
  css_class: string | null
  asset_url: string | null
  metadata: RewardMeta
  sort_order?: number
}

type Badge = {
  id: number
  slug: string
  name: string
  description: string
  category: string
  icon_url: string | null
  is_active: boolean
  metadata?: RewardMeta
  sort_order?: number
}

type Tab = 'stickers' | 'borders' | 'badges'
type StickerRow = { id: string; emoji: string; label: string; image: string }

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const emptySticker = (): StickerRow => ({ id: '', emoji: '', label: '', image: '' })

type FormState = {
  slug: string
  name: string
  description: string
  price_coins: number
  css_class: string
  asset_url: string
  category: string
  rarity: Rarity
  sort_order: number
  acquisition: Acquisition
  unlock_condition: string
  premium_only: boolean
  active: boolean
}

const initialForm: FormState = {
  slug: '',
  name: '',
  description: '',
  price_coins: 50,
  css_class: 'cosmetic-border-sakura',
  asset_url: '',
  category: 'general',
  rarity: 'comun',
  sort_order: 0,
  acquisition: 'purchase',
  unlock_condition: '',
  premium_only: false,
  active: true,
}

function RarityTag({ rarity }: { rarity?: Rarity }) {
  const r = rarityById(rarity)
  return (
    <span
      className="reward-rarity-tag"
      style={{ color: r.color, borderColor: r.color, boxShadow: `0 0 10px ${r.glow}` }}
    >
      {r.label}
    </span>
  )
}

export default function AdminRewardsManager() {
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const stickerFileRef = useRef<HTMLInputElement>(null)
  const stickerTargetRef = useRef<number | null>(null)
  const sketchFileRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('stickers')
  const [shop, setShop] = useState<ShopItem[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [stickerUploading, setStickerUploading] = useState<number | null>(null)

  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiSketchUrl, setAiSketchUrl] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState<FormState>(initialForm)
  const [stickers, setStickers] = useState<StickerRow[]>([
    { id: 'waifu', emoji: '💕', label: 'Waifu', image: '' },
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

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const resetForm = () => {
    setForm(initialForm)
    setStickers([emptySticker()])
    setEditingSlug(null)
    setAiPrompt('')
    setAiSketchUrl('')
  }

  const switchTab = (next: Tab) => {
    setTab(next)
    setForm({ ...initialForm, acquisition: next === 'badges' ? 'reward' : 'purchase' })
    setStickers([emptySticker()])
    setEditingSlug(null)
    setAiPrompt('')
    setAiSketchUrl('')
  }

  // ── Cargar un item existente para editar ──
  const editShopItem = (item: ShopItem) => {
    setTab(item.item_type === 'sticker_pack' ? 'stickers' : 'borders')
    setEditingSlug(item.slug)
    setForm({
      slug: item.slug,
      name: item.name,
      description: item.description || '',
      price_coins: item.price_coins,
      css_class: item.css_class || 'cosmetic-border-sakura',
      asset_url: item.asset_url || '',
      category: 'general',
      rarity: item.metadata?.rarity || 'comun',
      sort_order: item.sort_order || 0,
      acquisition: item.metadata?.acquisition || 'purchase',
      unlock_condition: item.metadata?.unlock_condition || '',
      premium_only: !!item.metadata?.premium_only,
      active: item.metadata?.active !== false,
    })
    if (item.item_type === 'sticker_pack') {
      const rows = (item.metadata?.stickers || []).map((s) => ({
        id: s.id,
        emoji: s.emoji || '',
        label: s.label,
        image: s.image || '',
      }))
      setStickers(rows.length ? rows : [emptySticker()])
    }
  }

  const editBadge = (b: Badge) => {
    setTab('badges')
    setEditingSlug(b.slug)
    setForm({
      slug: b.slug,
      name: b.name,
      description: b.description || '',
      price_coins: 0,
      css_class: '',
      asset_url: b.icon_url || '',
      category: b.category || 'general',
      rarity: b.metadata?.rarity || 'comun',
      sort_order: b.sort_order || 0,
      acquisition: b.metadata?.acquisition || 'reward',
      unlock_condition: b.metadata?.unlock_condition || '',
      premium_only: !!b.metadata?.premium_only,
      active: b.is_active !== false,
    })
  }

  // ── Plantillas curadas ──
  const applyStickerTemplate = (slug: string) => {
    const t = STICKER_TEMPLATES.find((x) => x.slug === slug)
    if (!t) return
    setEditingSlug(null)
    setForm((f) => ({
      ...f,
      slug: t.slug,
      name: t.name,
      rarity: t.rarity,
      price_coins: rarityById(t.rarity).price,
      description: `Pack ${rarityById(t.rarity).label.toLowerCase()} de stickers.`,
    }))
    setStickers(t.stickers.map((s) => ({ id: s.id, emoji: s.emoji, label: s.label, image: '' })))
  }

  const applyBadgeTemplate = (slug: string) => {
    const t = BADGE_TEMPLATES.find((x) => x.slug === slug)
    if (!t) return
    setEditingSlug(null)
    setForm((f) => ({
      ...f,
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      rarity: t.rarity,
      acquisition: 'reward',
    }))
  }

  const selectBorder = (cssClass: string, name: string, rarity: Rarity) => {
    setEditingSlug(null)
    setForm((f) => ({
      ...f,
      css_class: cssClass,
      name: f.name || name,
      slug: f.slug || slugify(name),
      rarity,
      price_coins: rarityById(rarity).price,
      description: f.description || BORDER_PRESETS.find((b) => b.css_class === cssClass)?.description || '',
    }))
  }

  // ── Subidas ──
  const upload = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', tab === 'badges' ? 'badges' : tab)
    const res = await fetch('/api/admin/rewards/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setField('asset_url', data.url)
    showToast({ title: 'Subida OK', description: 'Imagen lista' })
  }

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
        return { id, label, emoji: s.emoji.trim() || undefined, image: s.image.trim() || undefined }
      })
      .filter(Boolean) as StickerMeta[]

  // ── Guardar ──
  const save = async () => {
    if (!form.name.trim()) {
      showToast({ title: 'Falta nombre', description: 'Escribe un nombre visible' })
      return
    }
    setSaving(true)
    setJustSaved(false)
    try {
      const baseMeta = {
        rarity: form.rarity,
        acquisition: form.acquisition,
        unlock_condition: form.acquisition === 'reward' ? form.unlock_condition : '',
        premium_only: form.acquisition === 'premium' ? true : form.premium_only,
        active: form.active,
      }

      let body: Record<string, unknown>
      if (tab === 'badges') {
        body = {
          kind: 'badge',
          slug: form.slug || slugify(form.name),
          name: form.name,
          description: form.description,
          category: form.category,
          icon_url: form.asset_url,
          sort_order: form.sort_order,
          is_active: form.active,
          metadata: baseMeta,
        }
      } else if (tab === 'stickers') {
        const list = buildStickerMeta()
        if (list.length === 0) {
          showToast({ title: 'Faltan stickers', description: 'Agrega al menos uno con nombre y emoji/imagen' })
          setSaving(false)
          return
        }
        body = {
          kind: 'shop_item',
          item_type: 'sticker_pack',
          slug: form.slug || slugify(form.name),
          name: form.name,
          description: form.description,
          price_coins: Math.max(1, form.price_coins),
          asset_url: form.asset_url,
          sort_order: form.sort_order,
          metadata: { ...baseMeta, stickers: list },
        }
      } else {
        body = {
          kind: 'shop_item',
          item_type: 'avatar_border',
          slug: form.slug || slugify(form.name),
          name: form.name,
          description: form.description,
          price_coins: Math.max(1, form.price_coins),
          css_class: form.css_class,
          asset_url: form.asset_url,
          sort_order: form.sort_order,
          metadata: baseMeta,
        }
      }

      const res = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setEditingSlug(String(body.slug))
      setJustSaved(true)
      showToast({ title: editingSlug ? 'Actualizado ✓' : 'Creado ✓', description: form.name })
      load()
      setTimeout(() => setJustSaved(false), 2500)
    } catch (err) {
      showToast({ title: 'Error al guardar', description: String(err) })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (kind: 'shop_item' | 'badge', slug: string, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(
        `/api/admin/rewards?kind=${kind}&slug=${encodeURIComponent(slug)}`,
        { method: 'DELETE' },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: 'Eliminado', description: name })
      if (editingSlug === slug) resetForm()
      load()
    } catch (err) {
      showToast({ title: 'Error', description: String(err) })
    }
  }

  // ── IA ──
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
          { id: slugify(aiPrompt).slice(0, 24) || `sticker-${Date.now()}`, emoji: '', label: aiPrompt.slice(0, 24), image: data.url },
        ])
      } else {
        setField('asset_url', data.url)
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
  const previewStickers = buildStickerMeta()

  const tabMeta: Record<Tab, { title: string; help: string }> = {
    stickers: { title: 'Pack de stickers / emojis', help: 'Define emojis o sube imágenes. Se usan en el foro con :id:.' },
    borders: { title: 'Marco de avatar', help: 'Elige un marco de la galería o crea uno con clase CSS.' },
    badges: { title: 'Insignia', help: 'Sube un icono, agrega descripción y rareza.' },
  }

  return (
    <div className="admin-page space-y-6">
      <header>
        <p className="eyebrow mb-1">Premios</p>
        <h1 className="page-title">Stickers · Marcos · Insignias</h1>
        <p className="text-sm text-muted mt-2">
          Crea, edita, ordena y elimina premios. Click en cualquier elemento del catálogo para editarlo.
          Requiere schema-v18 y el bucket <code className="text-xs">rewards</code>.
        </p>
      </header>

      <div className="admin-reward-tabs">
        {([['stickers', '😀 Stickers'], ['borders', '🖼️ Marcos'], ['badges', '🏅 Insignias']] as const).map(
          ([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`admin-reward-tab${tab === id ? ' is-active' : ''}`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div className="admin-reward-grid">
        {/* ─── Formulario ─── */}
        <section className="card-glass p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display font-semibold text-text">{tabMeta[tab].title}</h2>
              {editingSlug ? (
                <p className="text-[11px] text-accent">Editando: {editingSlug}</p>
              ) : (
                <p className="text-[11px] text-faint">Nuevo elemento</p>
              )}
            </div>
            <button type="button" className="btn-ghost text-[11px]" onClick={resetForm}>
              + Nuevo
            </button>
          </div>
          <p className="text-xs text-muted">{tabMeta[tab].help}</p>

          {/* Plantillas rápidas */}
          {tab === 'stickers' && (
            <div className="admin-field">
              <span className="admin-field-label">Plantillas rápidas</span>
              <div className="flex flex-wrap gap-1.5">
                {STICKER_TEMPLATES.map((t) => (
                  <button key={t.slug} type="button" className="admin-ai-chip" onClick={() => applyStickerTemplate(t.slug)}>
                    {t.name} · {rarityById(t.rarity).label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tab === 'badges' && (
            <div className="admin-field">
              <span className="admin-field-label">Plantillas épicas / legendarias</span>
              <div className="flex flex-wrap gap-1.5">
                {BADGE_TEMPLATES.map((t) => (
                  <button key={t.slug} type="button" className="admin-ai-chip" onClick={() => applyBadgeTemplate(t.slug)}>
                    {t.emoji} {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Galería de marcos */}
          {tab === 'borders' && (
            <div className="admin-field">
              <span className="admin-field-label">Galería de marcos</span>
              <div className="admin-border-gallery">
                {BORDER_PRESETS.map((b) => (
                  <button
                    key={b.css_class}
                    type="button"
                    className={`admin-border-card${form.css_class === b.css_class ? ' is-active' : ''}`}
                    onClick={() => selectBorder(b.css_class, b.name, b.rarity)}
                    title={b.description}
                  >
                    <span className={`profile-avatar-ring ${b.css_class} admin-border-ring`}>
                      <span className="profile-avatar">A</span>
                    </span>
                    <span className="admin-border-name">{b.name}</span>
                    <RarityTag rarity={b.rarity} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="admin-field">
            <span className="admin-field-label">Nombre visible</span>
            <input
              className="input w-full text-sm"
              placeholder="Ej. Pack Otaku"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="admin-field">
              <span className="admin-field-label">Slug {editingSlug ? '' : '(auto)'}</span>
              <input
                className="input w-full text-sm"
                placeholder={form.name ? slugify(form.name) : 'slug-unico'}
                value={form.slug}
                onChange={(e) => setField('slug', e.target.value)}
              />
            </label>
            <label className="admin-field">
              <span className="admin-field-label">Orden</span>
              <input
                type="number"
                className="input w-full text-sm"
                value={form.sort_order}
                onChange={(e) => setField('sort_order', Number(e.target.value))}
              />
            </label>
          </div>

          <label className="admin-field">
            <span className="admin-field-label">Descripción</span>
            <textarea
              className="input w-full text-sm"
              rows={2}
              placeholder={tab === 'badges' ? 'Qué representa esta insignia y cómo se gana' : 'Descripción breve'}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="admin-field">
              <span className="admin-field-label">Rareza</span>
              <select
                className="input w-full text-sm"
                value={form.rarity}
                onChange={(e) => {
                  const rarity = e.target.value as Rarity
                  setForm((f) => ({
                    ...f,
                    rarity,
                    price_coins: f.acquisition === 'purchase' ? rarityById(rarity).price : f.price_coins,
                  }))
                }}
              >
                {RARITIES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            {tab === 'badges' ? (
              <label className="admin-field">
                <span className="admin-field-label">Categoría</span>
                <select
                  className="input w-full text-sm"
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                >
                  {BADGE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div />
            )}
          </div>

          {/* Modo de obtención (CMS) */}
          <div className="admin-acq-box">
            <span className="admin-field-label">¿Cómo se obtiene?</span>
            <div className="admin-acq-grid">
              {ACQUISITIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`admin-acq-option${form.acquisition === a.id ? ' is-active' : ''}`}
                  onClick={() => setField('acquisition', a.id)}
                  title={a.help}
                >
                  <span className="admin-acq-icon">{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>

            {form.acquisition === 'purchase' && (
              <label className="admin-field">
                <span className="admin-field-label">
                  Precio en <MeduCoin showName size={13} />
                </span>
                <input
                  type="number"
                  className="input w-full text-sm"
                  value={form.price_coins}
                  onChange={(e) => setField('price_coins', Number(e.target.value))}
                />
              </label>
            )}

            {form.acquisition === 'reward' && (
              <label className="admin-field">
                <span className="admin-field-label">Condición de desbloqueo</span>
                <input
                  className="input w-full text-sm"
                  list="unlock-activities"
                  placeholder="Ej. Publica 10 reseñas"
                  value={form.unlock_condition}
                  onChange={(e) => setField('unlock_condition', e.target.value)}
                />
                <datalist id="unlock-activities">
                  {UNLOCK_ACTIVITIES.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </label>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={form.premium_only}
                  onChange={(e) => setField('premium_only', e.target.checked)}
                />
                <span>Solo Premium</span>
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setField('active', e.target.checked)}
                />
                <span>Publicado (visible)</span>
              </label>
            </div>
          </div>

          {tab === 'borders' && (
            <label className="admin-field">
              <span className="admin-field-label">Clase CSS</span>
              <input
                className="input w-full text-sm font-mono text-xs"
                value={form.css_class}
                onChange={(e) => setField('css_class', e.target.value)}
              />
            </label>
          )}

          {/* Editor de stickers */}
          {tab === 'stickers' && (
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
                        onChange={(e) => updateSticker(i, { label: e.target.value, id: s.id || slugify(e.target.value) })}
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
                      >
                        {stickerUploading === i ? '…' : 'IMG'}
                      </button>
                      <button type="button" className="btn-ghost text-[10px] px-2" onClick={() => removeSticker(i)}>
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
          )}

          {/* Subida de imagen (marcos / insignias) */}
          {tab !== 'stickers' && (
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
                <button type="button" className="btn-ghost text-xs" onClick={() => fileRef.current?.click()}>
                  Subir imagen
                </button>
                {form.asset_url ? <span className="text-[10px] text-faint">✓ imagen cargada</span> : null}
              </div>
            </div>
          )}

          {/* IA */}
          {aiEnabled && (
            <div className="admin-ai-box">
              <div className="flex items-center justify-between gap-2">
                <span className="admin-field-label mb-0">✨ Generar con IA</span>
                <span className="text-[10px] text-faint">flux · ~$0.003/img</span>
              </div>
              <textarea
                className="input w-full text-sm"
                rows={2}
                placeholder="Describe el diseño…"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5">
                {aiPresets[tab].map((p) => (
                  <button key={p} type="button" className="admin-ai-chip" onClick={() => setAiPrompt(p)}>
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
                <button type="button" className="btn-ghost text-[11px]" disabled={aiLoading} onClick={() => sketchFileRef.current?.click()}>
                  {aiSketchUrl ? '✓ Boceto base' : 'Subir boceto (opcional)'}
                </button>
                {aiSketchUrl ? (
                  <button type="button" className="text-[10px] text-faint underline" onClick={() => setAiSketchUrl('')}>
                    quitar
                  </button>
                ) : null}
              </div>
              <button type="button" className="btn-primary text-sm w-full" disabled={aiLoading} onClick={generateAi}>
                {aiLoading ? 'Generando…' : 'Generar imagen'}
              </button>
            </div>
          )}

          <button
            type="button"
            className={`btn-primary text-sm w-full${justSaved ? ' admin-saved-flash' : ''}`}
            disabled={saving}
            onClick={save}
          >
            {saving ? 'Guardando…' : justSaved ? '✓ Guardado' : editingSlug ? 'Actualizar' : 'Crear en catálogo'}
          </button>
        </section>

        {/* ─── Vista previa ─── */}
        <section className="card-glass p-4 sm:p-6 space-y-4 admin-reward-preview">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-text">Vista previa</h2>
            <RarityTag rarity={form.rarity} />
          </div>
          <div className="admin-acq-summary">
            <span>{acquisitionById(form.acquisition).icon}</span>
            {form.acquisition === 'purchase' ? (
              <MeduCoin amount={form.price_coins} size={14} />
            ) : form.acquisition === 'reward' ? (
              <span className="text-xs text-muted">{form.unlock_condition || 'Logro / actividad'}</span>
            ) : (
              <span className="text-xs text-muted">{acquisitionById(form.acquisition).label}</span>
            )}
            {form.premium_only ? <span className="tag tag-accent text-[10px]">Premium</span> : null}
            {!form.active ? <span className="text-[10px] text-faint">(oculto)</span> : null}
          </div>

          {tab === 'borders' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className={`profile-avatar-ring ${form.css_class}`}>
                <span className="profile-avatar">A</span>
              </div>
              <p className="text-sm font-semibold text-text">{form.name || 'Marco sin nombre'}</p>
              {form.asset_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.asset_url} alt="" className="max-h-24 rounded-lg object-contain" />
              ) : null}
            </div>
          )}

          {tab === 'stickers' && (
            <div className="space-y-3">
              <p className="text-xs text-faint">{form.name || 'Pack sin nombre'} · {form.price_coins} 🪙</p>
              <div className="flex flex-wrap gap-3">
                {previewStickers.length === 0 ? (
                  <p className="text-xs text-faint">Agrega stickers para previsualizarlos.</p>
                ) : (
                  previewStickers.map((s) => (
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

          {tab === 'badges' && (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              {form.asset_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.asset_url} alt="" className="w-24 h-24 object-contain" />
              ) : (
                <span className="text-5xl">🏅</span>
              )}
              <p className="text-sm font-semibold text-text">{form.name || 'Insignia sin nombre'}</p>
              <p className="text-xs text-muted max-w-[260px]">{form.description || 'Sin descripción'}</p>
              <span className="tag tag-accent text-[10px]">{form.category}</span>
            </div>
          )}
        </section>
      </div>

      {/* ─── Catálogo actual (click para editar) ─── */}
      {!loading && (
        <section className="card-glass p-4 sm:p-6">
          <h2 className="font-display font-semibold text-text mb-4">
            Catálogo actual {tab === 'stickers' ? `(${stickerPacks.length})` : tab === 'borders' ? `(${borders.length})` : `(${badges.length})`}
          </h2>

          {tab === 'stickers' && (
            <ul className="admin-catalog-list">
              {stickerPacks.length === 0 ? (
                <li className="text-xs text-faint">Aún no hay packs.</li>
              ) : (
                stickerPacks.map((s) => (
                  <li key={s.id} className="admin-catalog-row">
                    <button type="button" className="admin-catalog-main" onClick={() => editShopItem(s)}>
                      <span className="admin-catalog-emojis">
                        {(s.metadata?.stickers || []).slice(0, 4).map((st) =>
                          st.image ? '🖼️' : st.emoji,
                        ).join(' ') || '—'}
                      </span>
                      <span className="admin-catalog-name">{s.name}</span>
                      <RarityTag rarity={s.metadata?.rarity} />
                      {(s.metadata?.acquisition || 'purchase') === 'purchase' ? (
                        <MeduCoin amount={s.price_coins} size={13} />
                      ) : (
                        <span className="text-faint text-xs">
                          {acquisitionById(s.metadata?.acquisition).icon} {acquisitionById(s.metadata?.acquisition).label}
                        </span>
                      )}
                    </button>
                    <button type="button" className="admin-catalog-del" onClick={() => remove('shop_item', s.slug, s.name)}>
                      ✕
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          {tab === 'borders' && (
            <ul className="admin-catalog-list">
              {borders.length === 0 ? (
                <li className="text-xs text-faint">Aún no hay marcos.</li>
              ) : (
                borders.map((s) => (
                  <li key={s.id} className="admin-catalog-row">
                    <button type="button" className="admin-catalog-main" onClick={() => editShopItem(s)}>
                      <span className={`profile-avatar-ring ${s.css_class} admin-catalog-ring`}>
                        <span className="profile-avatar">A</span>
                      </span>
                      <span className="admin-catalog-name">{s.name}</span>
                      <RarityTag rarity={s.metadata?.rarity} />
                      {(s.metadata?.acquisition || 'purchase') === 'purchase' ? (
                        <MeduCoin amount={s.price_coins} size={13} />
                      ) : (
                        <span className="text-faint text-xs">
                          {acquisitionById(s.metadata?.acquisition).icon} {acquisitionById(s.metadata?.acquisition).label}
                        </span>
                      )}
                    </button>
                    <button type="button" className="admin-catalog-del" onClick={() => remove('shop_item', s.slug, s.name)}>
                      ✕
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          {tab === 'badges' && (
            <ul className="admin-badge-grid">
              {badges.length === 0 ? (
                <li className="text-xs text-faint">Aún no hay insignias.</li>
              ) : (
                badges.map((b) => (
                  <li key={b.id} className="admin-badge-card">
                    <button type="button" className="admin-badge-main" onClick={() => editBadge(b)}>
                      {b.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.icon_url} alt="" className="w-12 h-12 mx-auto object-contain mb-1" />
                      ) : (
                        <span className="text-2xl block mb-1">{b.metadata?.emoji || '🏅'}</span>
                      )}
                      <p className="text-xs font-semibold">{b.name}</p>
                      <RarityTag rarity={b.metadata?.rarity} />
                    </button>
                    <button type="button" className="admin-catalog-del admin-badge-del" onClick={() => remove('badge', b.slug, b.name)}>
                      ✕
                    </button>
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
