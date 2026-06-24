'use client'

import { useEffect, useState } from 'react'
import ContentSearchPicker, { defaultListStatus } from './ContentSearchPicker'
import type { ShowcaseSection } from '../../lib/content-search'

const SECTIONS = [
  { id: 'anime' as const, label: 'Anime viendo' },
  { id: 'manga' as const, label: 'Manga leyendo' },
  { id: 'game' as const, label: 'Juegos' },
]

type Slot = {
  slot: number
  section: string
  title: string
  content_id: string
  image_url: string
  list_status: string
}

type Draft = {
  title: string
  content_id: string
  image_url: string
  list_status: string
}

const EMPTY_SLOT: Draft = { title: '', content_id: '', image_url: '', list_status: 'watching' }

export default function ProfileShowcaseEditor() {
  const [section, setSection] = useState<ShowcaseSection>('anime')
  const [items, setItems] = useState<Slot[]>([])
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/profile/showcase', { cache: 'no-store' })
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const sectionItems = items.filter((i) => i.section === section)

  const getDraft = (slot: number): Draft => {
    const existing = sectionItems.find((i) => i.slot === slot)
    return (
      drafts[slot] || {
        title: existing?.title || '',
        content_id: existing?.content_id || '',
        image_url: existing?.image_url || '',
        list_status: existing?.list_status || defaultListStatus(section),
      }
    )
  }

  const setDraft = (slot: number, patch: Partial<Draft>) => {
    setDrafts((d) => ({ ...d, [slot]: { ...getDraft(slot), ...patch } }))
  }

  const save = async (slot: number) => {
    const d = getDraft(slot)
    if (!d.title.trim()) return
    setSaving(slot)
    setError(null)
    try {
      const res = await fetch('/api/profile/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          slot,
          title: d.title,
          content_id: d.content_id || null,
          image_url: d.image_url || null,
          list_status: d.list_status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      await load()
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[slot]
        return next
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(null)
    }
  }

  const clear = async (slot: number) => {
    setSaving(slot)
    setError(null)
    try {
      const res = await fetch('/api/profile/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, slot, clear: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[slot]
        return next
      })
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p className="text-sm text-muted">Cargando vitrina…</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`btn-ghost text-xs ${section === s.id ? 'border-accent text-accent' : ''}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        Elige hasta 5 títulos por sección con el buscador. Se guardan nombre e imagen automáticamente.
      </p>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((slot) => {
          const d = getDraft(slot)
          const filled = sectionItems.some((i) => i.slot === slot)
          const selected =
            d.title.trim().length > 0
              ? { title: d.title, content_id: d.content_id, image_url: d.image_url }
              : null

          return (
            <div key={slot} className="rounded-lg border border-white/8 bg-surface-3/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-faint">Espacio {slot}</p>
              <ContentSearchPicker
                section={section}
                value={selected}
                onSelect={(item) =>
                  setDraft(slot, {
                    title: item.title,
                    content_id: item.content_id,
                    image_url: item.image_url,
                    list_status: d.list_status || defaultListStatus(section),
                  })
                }
                onClear={() =>
                  setDraft(slot, {
                    title: '',
                    content_id: '',
                    image_url: '',
                    list_status: defaultListStatus(section),
                  })
                }
              />
              <select
                className="input w-full text-sm"
                value={d.list_status}
                onChange={(e) => setDraft(slot, { list_status: e.target.value })}
              >
                {section === 'manga' ? (
                  <option value="reading">Leyendo</option>
                ) : section === 'game' ? (
                  <option value="watching">Jugando</option>
                ) : (
                  <option value="watching">Viendo</option>
                )}
                <option value="completed">Completado</option>
                <option value="pending">Pendiente</option>
                <option value="dropped">Abandonado</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={saving === slot || !d.title.trim()}
                  onClick={() => save(slot)}
                >
                  {saving === slot ? 'Guardando…' : 'Guardar'}
                </button>
                {filled ? (
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    disabled={saving === slot}
                    onClick={() => clear(slot)}
                  >
                    Vaciar
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
