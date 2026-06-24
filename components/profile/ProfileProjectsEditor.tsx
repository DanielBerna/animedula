'use client'

import { useEffect, useState } from 'react'

type Project = {
  slot: number
  title: string
  description: string
  link_url: string | null
}

const EMPTY = { title: '', description: '', link_url: '' }

export default function ProfileProjectsEditor() {
  const [intro, setIntro] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [drafts, setDrafts] = useState<Record<number, typeof EMPTY>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | 'intro' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/profile/projects', { cache: 'no-store' })
    const data = await res.json()
    setProjects(data.projects || [])
    setIntro(data.intro || '')
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const getDraft = (slot: number) => {
    const existing = projects.find((p) => p.slot === slot)
    return (
      drafts[slot] || {
        title: existing?.title || '',
        description: existing?.description || '',
        link_url: existing?.link_url || '',
      }
    )
  }

  const setDraft = (slot: number, patch: Partial<typeof EMPTY>) => {
    setDrafts((d) => ({ ...d, [slot]: { ...getDraft(slot), ...patch } }))
  }

  const saveIntro = async () => {
    setSaving('intro')
    setError(null)
    try {
      const res = await fetch('/api/profile/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intro }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(null)
    }
  }

  const save = async (slot: number) => {
    const d = getDraft(slot)
    setSaving(slot)
    setError(null)
    try {
      const res = await fetch('/api/profile/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot,
          title: d.title,
          description: d.description,
          link_url: d.link_url || null,
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
    try {
      const res = await fetch('/api/profile/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, clear: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p className="text-sm text-muted">Cargando proyectos…</p>

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Comparte hasta 5 proyectos o trabajos en curso. Los amigos pueden comentar en tu muro.
      </p>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div>
        <label className="text-xs text-faint block mb-1">Intro breve (opcional)</label>
        <textarea
          className="input w-full text-sm"
          rows={2}
          maxLength={400}
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="Qué estás construyendo o buscando…"
        />
        <button type="button" className="btn-ghost text-xs mt-2" disabled={saving === 'intro'} onClick={saveIntro}>
          {saving === 'intro' ? 'Guardando…' : 'Guardar intro'}
        </button>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((slot) => {
          const d = getDraft(slot)
          const filled = projects.some((p) => p.slot === slot)
          return (
            <div key={slot} className="rounded-lg border border-white/8 bg-surface-3/40 p-4 space-y-2">
              <p className="text-xs font-semibold text-faint">Proyecto {slot}</p>
              <input
                className="input w-full text-sm"
                placeholder="Título"
                value={d.title}
                onChange={(e) => setDraft(slot, { title: e.target.value })}
              />
              <textarea
                className="input w-full text-sm"
                rows={3}
                placeholder="Descripción (mín. 10 caracteres)"
                value={d.description}
                onChange={(e) => setDraft(slot, { description: e.target.value })}
              />
              <input
                className="input w-full text-sm"
                placeholder="Enlace HTTPS (opcional)"
                value={d.link_url}
                onChange={(e) => setDraft(slot, { link_url: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={saving === slot}
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
