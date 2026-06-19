'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { isValidUsername } from '../lib/profiles/public'

type Props = {
  initialUsername?: string | null
}

export default function UsernameForm({ initialUsername }: Props) {
  const [username, setUsername] = useState(initialUsername || '')
  const [saved, setSaved] = useState(initialUsername || '')
  const [loading, setLoading] = useState(!initialUsername)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialUsername !== undefined) return
    fetch('/api/profile/username')
      .then((r) => r.json())
      .then((data) => {
        if (data.username) {
          setUsername(data.username)
          setSaved(data.username)
        }
      })
      .finally(() => setLoading(false))
  }, [initialUsername])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = username.toLowerCase().trim()
    if (!isValidUsername(value)) {
      setError('Usa 3–24 caracteres: letras minúsculas, números o _')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar')
      setSaved(value)
      setUsername(value)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Cargando usuario…</p>

  const siteUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://animedula.com')

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-faint uppercase tracking-wide">Usuario público</label>
          <div className="flex mt-1">
            <span className="inline-flex items-center px-3 text-sm text-muted bg-surface-3 border border-white/8 border-r-0 rounded-l-lg">
              @
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="tu_usuario"
              className="flex-1 p-2.5 bg-surface-3 border border-white/8 rounded-r-lg text-sm text-text"
              maxLength={24}
              pattern="[a-z0-9_]{3,24}"
            />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
      {error && <p className="text-xs text-sakura">{error}</p>}
      {saved ? (
        <p className="text-sm text-muted">
          Perfil público:{' '}
          <Link href={`/u/${saved}`} className="text-accent hover:underline">
            {siteUrl}/u/{saved}
          </Link>
        </p>
      ) : (
        <p className="text-xs text-faint">Elige un usuario para compartir tu perfil en redes.</p>
      )}
    </div>
  )
}
