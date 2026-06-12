'use client'

import { useState } from 'react'
import Link from 'next/link'

const FIELDS = [
  { id: 'gancho', label: 'Gancho (una línea)' },
  { id: 'por_que', label: 'Por qué vale la pena' },
  { id: 'para_quien', label: 'Para quién es' },
  { id: 'no_para', label: 'Pásalo si…' },
  { id: 'contexto_practico', label: 'Cómo disfrutarlo' },
] as const

type Props = {
  kind: 'anime' | 'manga'
  malId: number
  loggedIn: boolean
}

export default function SubmissionForm({ kind, malId, loggedIn }: Props) {
  const [field, setField] = useState<string>(FIELDS[0].id)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loggedIn) {
    return (
      <p className="text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">Inicia sesión</Link> para proponer mejoras a la reseña.
      </p>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, mal_id: malId, field, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setBody('')
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return <p className="text-sm text-muted">Gracias — un editor revisará tu aporte.</p>
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <select
        value={field}
        onChange={(e) => setField(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-surface-3 border border-white/8 text-sm text-text"
      >
        {FIELDS.map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        minLength={10}
        placeholder="Tu propuesta de texto…"
        className="w-full p-3 bg-surface-3 border border-white/8 rounded-lg text-sm text-text min-h-[80px]"
      />
      {error && <p className="text-xs text-sakura">{error}</p>}
      <button type="submit" disabled={sending} className="btn-ghost text-sm">
        {sending ? 'Enviando…' : 'Enviar aporte'}
      </button>
    </form>
  )
}
