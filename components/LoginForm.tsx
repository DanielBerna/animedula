'use client'

import { useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '../lib/supabase/client'
import { safeRedirectPath } from '../lib/security/redirect'

type Props = {
  next?: string
  error?: string
}

export default function LoginForm({ next: nextProp = '/', error }: Props) {
  const next = safeRedirectPath(nextProp, '/')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!isSupabaseBrowserConfigured()) {
    return (
      <p className="text-sm text-muted">
        Configura <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
        <code className="text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> en tu entorno.
      </p>
    )
  }

  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (err) throw err
      setMessage('Revisa tu correo — te enviamos un enlace para entrar.')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'No se pudo enviar el enlace')
    } finally {
      setLoading(false)
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      window.location.href = next
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {error === 'auth' && (
        <p className="text-sm text-sakura">El enlace expiró o falló. Intenta de nuevo.</p>
      )}
      {error === 'supabase' && (
        <p className="text-sm text-sakura">Supabase no está configurado en el servidor.</p>
      )}
      {message && <p className="text-sm text-muted">{message}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          className={`text-xs px-3 py-1.5 rounded-full border ${mode === 'magic' ? 'border-accent bg-accent-dim text-text' : 'border-white/10 text-muted'}`}
          onClick={() => setMode('magic')}
        >
          Enlace por correo
        </button>
        <button
          type="button"
          className={`text-xs px-3 py-1.5 rounded-full border ${mode === 'password' ? 'border-accent bg-accent-dim text-text' : 'border-white/10 text-muted'}`}
          onClick={() => setMode('password')}
        >
          Contraseña
        </button>
      </div>

      <form onSubmit={mode === 'magic' ? handleMagicLink : handlePassword} className="space-y-4">
        <div>
          <label htmlFor="email" className="eyebrow block mb-2">Correo</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-white/8 text-sm text-text focus:outline-none focus:border-accent/50"
            placeholder="tu@email.com"
          />
        </div>
        {mode === 'password' && (
          <div>
            <label htmlFor="password" className="eyebrow block mb-2">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-3 border border-white/8 text-sm text-text focus:outline-none focus:border-accent/50"
            />
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Enviando…' : mode === 'magic' ? 'Enviar enlace' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
