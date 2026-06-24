'use client'

import { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'anime', label: 'Anime viendo' },
  { id: 'manga', label: 'Manga leyendo' },
  { id: 'game', label: 'Juegos' },
] as const

type Slot = {
  slot: number
  section: string
  title: string
  content_id: string
  image_url: string
  list_status: string
}

const EMPTY_SLOT = { title: '', content_id: '', image_url: '', list_status: 'watching' }

export default function ProfileShowcaseEditor() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>('anime')
  const [items, setItems] = useState<Slot[]>([])
  const [drafts, setDrafts] = useState<Record<number, typeof EMPTY_SLOT>>({})
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
  const getDraft = (slot: number) => {
    const existing = sectionItems.find((i) => i.slot === slot)
    return (
      drafts[slot] || {
        title: existing?.title || '',
        content_id: existing?.content_id || '',
        image_url: existing?.image_url || '',
        list_status: existing?.list_status || 'watching',
      }
    )
  }

  const setDraft = (slot: number, patch: Partial<typeof EMPTY_SLOT>) => {
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
      <p className="text-xs text-muted">Hasta 5 títulos por sección. Aparecen en tu perfil público.</p>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((slot) => {
          const d = getDraft(slot)
          const filled = sectionItems.some((i) => i.slot === slot)
          return (
            <div key={slot} className="rounded-lg border border-white/8 bg-surface-3/40 p-4 space-y-2">
              <p className="text-xs font-semibold text-faint">Slot {slot}</p>
              <input
                className="input w-full text-sm"
                placeholder="Título"
                value={d.title}
                onChange={(e) => setDraft(slot, { title: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  className="input w-full text-sm"
                  placeholder="ID ficha (opcional)"
                  value={d.content_id}
                  onChange={(e) => setDraft(slot, { content_id: e.target.value })}
                />
                <input
                  className="input w-full text-sm"
                  placeholder="URL imagen (opcional)"
                  value={d.image_url}
                  onChange={(e) => setDraft(slot, { image_url: e.target.value })}
                />
              </div>
              <select
                className="input w-full text-sm"
                value={d.list_status}
                onChange={(e) => setDraft(slot, { list_status: e.target.value })}
              >
                <option value="watching">Viendo / Jugando</option>
                <option value="reading">Leyendo</option>
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
                  <button type="button" className="btn-ghost text-xs" disabled={saving === slot} onClick={() => clear(slot)}>
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
