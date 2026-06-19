'use client'

import { useEffect, useState } from 'react'

const ACTIONS = [
  { id: 'idle', label: 'En línea' },
  { id: 'watching', label: 'Viendo anime' },
  { id: 'reading', label: 'Leyendo manga' },
  { id: 'playing', label: 'Jugando' },
] as const

export default function ProfileStatusForm() {
  const [statusText, setStatusText] = useState('')
  const [action, setAction] = useState('idle')
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [title, setTitle] = useState('Novato')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.status) {
          setStatusText(data.status.status_text || '')
          setAction(data.status.current_action || 'idle')
          setXp(data.status.xp ?? 0)
          setLevel(data.status.level ?? 1)
          setTitle(data.status.selected_title || 'Novato')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/profile/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_text: statusText, current_action: action }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Cargando perfil…</p>

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="tag tag-accent">Nivel {level}</span>
        <span className="tag">{xp} XP</span>
        <span className="tag tag-gold">{title}</span>
      </div>

      <div>
        <label className="text-xs text-faint uppercase tracking-wide">Estado personalizado</label>
        <input
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          placeholder="Ej. Sufriendo en el DLC de Elden Ring 🎮"
          className="w-full mt-1 p-2.5 bg-surface-3 border border-white/8 rounded-lg text-sm text-text"
          maxLength={120}
        />
      </div>

      <div>
        <label className="text-xs text-faint uppercase tracking-wide">Qué estás haciendo</label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full mt-1 p-2.5 bg-surface-3 border border-white/8 rounded-lg text-sm text-text"
        >
          {ACTIONS.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={saving} className="btn-primary text-sm">
        {saving ? 'Guardando…' : 'Guardar estado'}
      </button>
      {saved && <p className="text-xs text-faint">Estado actualizado. Visible en el foro.</p>}
    </form>
  )
}
