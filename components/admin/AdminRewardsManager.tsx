'use client'
/* eslint-disable @next/next/no-img-element */

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
  border_style?: 'css' | 'image'
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
  border_style: 'css' | 'image'
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
  border_style: 'css',
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
  const [modalOpen, setModalOpen] = useState(false)

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
    setForm({ ...initialForm, acquisition: tab === 'badges' ? 'reward' : 'purchase' })
    setStickers([emptySticker()])
    setEditingSlug(null)
    setAiPrompt('')
    setAiSketchUrl('')
  }

  const openNew = () => {
    resetForm()
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

  const switchTab = (next: Tab) => {
    setTab(next)
    setForm({ ...initialForm, acquisition: next === 'badges' ? 'reward' : 'purchase' })
    setStickers([emptySticker()])
    setEditingSlug(null)
    setAiPrompt('')
    setAiSketchUrl('')
    setModalOpen(false)
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
      border_style: item.metadata?.border_style || (item.asset_url && !item.css_class ? 'image' : 'css'),
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
    setModalOpen(true)
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
      border_style: 'css',
    })
    setModalOpen(true)
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
          css_class: form.border_style === 'image' ? '' : form.css_class,
          asset_url: form.asset_url,
          sort_order: form.sort_order,
          metadata: { ...baseMeta, border_style: form.border_style },
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

  // Guardar UN sticker como su propio pack individual (no todo el pack)
  const saveSingleSticker = async (row: StickerRow) => {
    const label = row.label.trim()
    const id = (row.id.trim() || slugify(label)).trim()
    if (!id || !label || (!row.emoji.trim() && !row.image.trim())) {
      showToast({ title: 'Sticker incompleto', description: 'Necesita nombre y emoji o imagen' })
      return
    }
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'shop_item',
          item_type: 'sticker_pack',
          slug: `sticker-${id}`,
          name: label,
          description: `Sticker ${label}`,
          price_coins: Math.max(1, form.price_coins),
          sort_order: form.sort_order,
          metadata: {
            rarity: form.rarity,
            acquisition: form.acquisition,
            active: form.active,
            stickers: [{ id, label, emoji: row.emoji.trim() || undefined, image: row.image.trim() || undefined }],
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: 'Sticker guardado', description: `${label} (individual)` })
      load()
    } catch (err) {
      showToast({ title: 'Error', description: String(err) })
    }
  }

  // Habilitar / deshabilitar sin abrir el modal
  const toggleShopActive = async (item: ShopItem, active: boolean) => {
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'shop_item',
          item_type: item.item_type,
          slug: item.slug,
          name: item.name,
          description: item.description,
          price_coins: Math.max(1, item.price_coins),
          css_class: item.css_class,
          asset_url: item.asset_url,
          sort_order: item.sort_order || 0,
          metadata: { ...item.metadata, active },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: active ? 'Habilitado' : 'Deshabilitado', description: item.name })
      load()
    } catch (err) {
      showToast({ title: 'Error', description: String(err) })
    }
  }

  const toggleBadgeActive = async (b: Badge, active: boolean) => {
    try {
      const res = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'badge',
          slug: b.slug,
          name: b.name,
          description: b.description,
          category: b.category,
          icon_url: b.icon_url,
          sort_order: b.sort_order || 0,
          is_active: active,
          metadata: { ...b.metadata },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast({ title: active ? 'Habilitada' : 'Deshabilitada', description: b.name })
      load()
    } catch (err) {
      showToast({ title: 'Error', description: String(err) })
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

  // Individual = pack con un solo sticker
  const isIndividual = (s: ShopItem) => (s.metadata?.stickers?.length || 0) <= 1
  const stickerMultiPacks = stickerPacks.filter((s) => !isIndividual(s))
  const stickerSingles = stickerPacks.filter((s) => isIndividual(s))

  // Agrupar por rareza (orden de RARITIES)
  const groupByRarity = <T extends { metadata?: RewardMeta }>(items: T[]) => {
    const groups: { rarity: Rarity; items: T[] }[] = []
    for (const r of RARITIES) {
      const list = items.filter((i) => (i.metadata?.rarity || 'comun') === r.id)
      if (list.length) groups.push({ rarity: r.id, items: list })
    }
    return groups
  }

  // Agrupar insignias por categoría
  const badgesByCategory = (() => {
    const map = new Map<string, Badge[]>()
    for (const b of badges) {
      const cat = b.category || 'general'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(b)
    }
    return [...map.entries()]
  })()

  const currentCount =
    tab === 'stickers' ? stickerPacks.length : tab === 'borders' ? borders.length : badges.length

  const tabMeta: Record<Tab, { title: string; help: string }> = {
    stickers: { title: 'Pack de stickers / emojis', help: 'Define emojis o sube imágenes. Se usan en el foro con :id:.' },
    borders: { title: 'Marco de avatar', help: 'Elige un marco de la galería o crea uno con clase CSS.' },
    badges: { title: 'Insignia', help: 'Sube un icono, agrega descripción y rareza.' },
  }

  const acqDisplay = (meta?: RewardMeta, price?: number) => {
    const acq = meta?.acquisition || 'purchase'
    if (acq === 'purchase') return <MeduCoin amount={price ?? 0} size={13} />
    return (
      <span className="text-faint text-xs">
        {acquisitionById(acq).icon} {acquisitionById(acq).label}
      </span>
    )
  }

  const shopVisual = (s: ShopItem) => {
    if (s.item_type === 'avatar_border') {
      if (s.metadata?.border_style === 'image' && s.asset_url) {
        return (
          <span className="avatar-frame admin-catalog-ring">
            <span className="profile-avatar avatar-frame-base">A</span>
            <img src={s.asset_url} alt="" className="avatar-frame-img" />
          </span>
        )
      }
      return (
        <span className={`profile-avatar-ring ${s.css_class || ''} admin-catalog-ring`}>
          <span className="profile-avatar">A</span>
        </span>
      )
    }
    const first = s.metadata?.stickers?.[0]
    return (
      <span className="admin-cat-glyph">
        {first?.image ? <img src={first.image} alt="" /> : <span>{first?.emoji || '😀'}</span>}
      </span>
    )
  }

  const renderShopRow = (s: ShopItem) => {
    const off = s.metadata?.active === false
    return (
      <li key={s.id} className={`admin-cat-item${off ? ' is-disabled' : ''}`}>
        <div className="admin-cat-info">
          {shopVisual(s)}
          <div className="admin-cat-text">
            <p className="admin-cat-name">{s.name}</p>
            <div className="admin-cat-meta">
              <RarityTag rarity={s.metadata?.rarity} />
              {acqDisplay(s.metadata, s.price_coins)}
              {off ? <span className="admin-cat-off">Oculto</span> : null}
            </div>
            {s.item_type === 'sticker_pack' && (s.metadata?.stickers?.length || 0) > 0 ? (
              <div className="admin-cat-stickers">
                {(s.metadata?.stickers || []).map((st, i) => (
                  <span key={i} className="admin-cat-chip" title={st.label}>
                    {st.image ? <img src={st.image} alt="" /> : st.emoji}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="admin-cat-actions">
          <button type="button" className="admin-act-btn" onClick={() => editShopItem(s)}>
            Editar
          </button>
          <button type="button" className="admin-act-btn" onClick={() => toggleShopActive(s, off)}>
            {off ? 'Habilitar' : 'Deshabilitar'}
          </button>
          <button type="button" className="admin-act-btn admin-act-del" onClick={() => remove('shop_item', s.slug, s.name)}>
            Eliminar
          </button>
        </div>
      </li>
    )
  }

  const renderBadgeRow = (b: Badge) => {
    const off = b.is_active === false
    return (
      <li key={b.id} className={`admin-cat-item${off ? ' is-disabled' : ''}`}>
        <div className="admin-cat-info">
          <span className="admin-cat-glyph">
            {b.icon_url ? <img src={b.icon_url} alt="" /> : <span>{b.metadata?.emoji || '🏅'}</span>}
          </span>
          <div className="admin-cat-text">
            <p className="admin-cat-name">{b.name}</p>
            <div className="admin-cat-meta">
              <RarityTag rarity={b.metadata?.rarity} />
              <span className="text-faint text-xs">
                {acquisitionById(b.metadata?.acquisition || 'reward').icon} {b.category}
              </span>
              {off ? <span className="admin-cat-off">Oculta</span> : null}
            </div>
            {b.description ? <p className="admin-cat-desc">{b.description}</p> : null}
          </div>
        </div>
        <div className="admin-cat-actions">
          <button type="button" className="admin-act-btn" onClick={() => editBadge(b)}>
            Editar
          </button>
          <button type="button" className="admin-act-btn" onClick={() => toggleBadgeActive(b, off)}>
            {off ? 'Habilitar' : 'Deshabilitar'}
          </button>
          <button type="button" className="admin-act-btn admin-act-del" onClick={() => remove('badge', b.slug, b.name)}>
            Eliminar
          </button>
        </div>
      </li>
    )
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

      {/* Toolbar */}
      <div className="admin-reward-toolbar">
        <p className="text-sm text-muted">{currentCount} elemento(s) en catálogo</p>
        <button type="button" className="btn-primary text-sm" onClick={openNew}>
          + Agregar nuevo
        </button>
      </div>

      {/* Catálogo agrupado */}
      {loading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : tab === 'stickers' ? (
        <div className="space-y-6">
          <div>
            <h3 className="admin-cat-section">Packs ({stickerMultiPacks.length})</h3>
            {stickerMultiPacks.length === 0 ? (
              <p className="text-xs text-faint">Aún no hay packs. Crea uno con “Agregar nuevo”.</p>
            ) : (
              groupByRarity(stickerMultiPacks).map((g) => (
                <div key={g.rarity} className="admin-cat-group">
                  <p className="admin-cat-group-label">{rarityById(g.rarity).label}</p>
                  <ul className="admin-cat-list">{g.items.map(renderShopRow)}</ul>
                </div>
              ))
            )}
          </div>
          <div>
            <h3 className="admin-cat-section">Stickers individuales ({stickerSingles.length})</h3>
            {stickerSingles.length === 0 ? (
              <p className="text-xs text-faint">Sin stickers individuales todavía.</p>
            ) : (
              groupByRarity(stickerSingles).map((g) => (
                <div key={g.rarity} className="admin-cat-group">
                  <p className="admin-cat-group-label">{rarityById(g.rarity).label}</p>
                  <ul className="admin-cat-list">{g.items.map(renderShopRow)}</ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : tab === 'borders' ? (
        <div className="space-y-4">
          {borders.length === 0 ? (
            <p className="text-xs text-faint">Aún no hay marcos. Crea uno con “Agregar nuevo”.</p>
          ) : (
            groupByRarity(borders).map((g) => (
              <div key={g.rarity} className="admin-cat-group">
                <p className="admin-cat-group-label">{rarityById(g.rarity).label}</p>
                <ul className="admin-cat-list">{g.items.map(renderShopRow)}</ul>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {badges.length === 0 ? (
            <p className="text-xs text-faint">Aún no hay insignias. Crea una con “Agregar nuevo”.</p>
          ) : (
            badgesByCategory.map(([cat, list]) => (
              <div key={cat} className="admin-cat-group">
                <p className="admin-cat-group-label">{cat}</p>
                <ul className="admin-cat-list">{list.map(renderBadgeRow)}</ul>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal crear / editar */}
      {modalOpen && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2 className="font-display font-semibold text-text text-base">
                {editingSlug ? `Editar · ${editingSlug}` : `Crear · ${tabMeta[tab].title}`}
              </h2>
              <button type="button" className="admin-modal-close" onClick={closeModal} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
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

          {/* Tipo de marco: CSS o Imagen */}
          {tab === 'borders' && (
            <div className="admin-field">
              <span className="admin-field-label">Tipo de marco</span>
              <div className="admin-acq-grid">
                <button
                  type="button"
                  className={`admin-acq-option${form.border_style === 'css' ? ' is-active' : ''}`}
                  onClick={() => setField('border_style', 'css')}
                >
                  🎨 Diseño CSS
                </button>
                <button
                  type="button"
                  className={`admin-acq-option${form.border_style === 'image' ? ' is-active' : ''}`}
                  onClick={() => setField('border_style', 'image')}
                >
                  🖼️ Imagen (formas/diseño)
                </button>
              </div>
            </div>
          )}

          {/* Galería de marcos (solo CSS) */}
          {tab === 'borders' && form.border_style === 'css' && (
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

          {tab === 'borders' && form.border_style === 'css' && (
            <label className="admin-field">
              <span className="admin-field-label">Clase CSS</span>
              <input
                className="input w-full text-sm font-mono text-xs"
                value={form.css_class}
                onChange={(e) => setField('css_class', e.target.value)}
              />
            </label>
          )}
          {tab === 'borders' && form.border_style === 'image' && (
            <p className="text-[11px] text-faint">
              Sube un PNG con el centro transparente (forma/diseño del marco). Se mostrará alrededor del avatar.
            </p>
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
                        title="Subir imagen personalizada"
                      >
                        {stickerUploading === i ? '…' : 'IMG'}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-[10px] px-2"
                        onClick={() => saveSingleSticker(s)}
                        title="Guardar este sticker como individual"
                      >
                        💾
                      </button>
                      <button type="button" className="btn-ghost text-[10px] px-2" onClick={() => removeSticker(i)} title="Quitar">
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
              {form.border_style === 'image' ? (
                <div className="avatar-frame">
                  <span className="profile-avatar avatar-frame-base">A</span>
                  {form.asset_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.asset_url} alt="" className="avatar-frame-img" />
                  ) : (
                    <span className="avatar-frame-empty">Sube una imagen</span>
                  )}
                </div>
              ) : (
                <div className={`profile-avatar-ring ${form.css_class}`}>
                  <span className="profile-avatar">A</span>
                </div>
              )}
              <p className="text-sm font-semibold text-text">{form.name || 'Marco sin nombre'}</p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
