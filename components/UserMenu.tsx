'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseBrowserConfigured } from '../lib/supabase/client'
import type { Profile } from '../lib/auth'

type Props = {
  variant?: 'inline' | 'drawer'
}

export default function UserMenu({ variant = 'inline' }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setReady(true)
      return
    }

    const supabase = createClient()

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        setReady(true)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role, username')
        .eq('id', user.id)
        .maybeSingle()
      setProfile((data as Profile) || null)
      setReady(true)
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!isSupabaseBrowserConfigured()) return null
  if (!ready) return <span className="header-auth-skeleton" aria-hidden />

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setProfile(null)
    setOpen(false)
    router.refresh()
    router.push('/')
  }

  const isDrawer = variant === 'drawer'
  const isStaff = profile?.role === 'editor' || profile?.role === 'admin'
  const label = profile?.display_name?.[0]?.toUpperCase() || '?'
  const profileHref = profile?.username ? `/u/${profile.username}` : '/perfil'

  // ── Drawer (hamburguesa móvil): lista vertical sin desplegable ──
  if (isDrawer) {
    if (!profile) {
      return (
        <Link href="/login" className="btn-ghost text-xs py-2 px-3 w-full text-center">
          Entrar
        </Link>
      )
    }
    return (
      <div className="user-menu-drawer">
        <div className="user-menu-profile user-menu-profile-drawer">
          <Link href={profileHref} className="user-avatar" title={profile.display_name || 'Mi perfil'}>
            {label}
          </Link>
          {profile.display_name && (
            <span className="text-sm text-text truncate">{profile.display_name}</span>
          )}
        </div>
        <Link href="/perfil" className="btn-ghost w-full text-center py-2 text-xs">
          Mi cuenta
        </Link>
        {isStaff && (
          <Link href="/admin" className="btn-ghost w-full text-center py-2 text-xs">
            Panel admin
          </Link>
        )}
        <button type="button" onClick={signOut} className="btn-ghost w-full text-center py-2 text-xs">
          Salir
        </button>
      </div>
    )
  }

  // ── Inline (web): desplegable al hacer clic en el avatar ──
  if (!profile) {
    return (
      <Link href="/login" className="btn-ghost text-xs py-2 px-3">
        Entrar
      </Link>
    )
  }

  return (
    <div className="user-menu-dropdown" ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger focus-ring"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de cuenta"
      >
        <span className="user-avatar">{label}</span>
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-panel-head">
            <span className="user-avatar">{label}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">
                {profile.display_name || 'Mi perfil'}
              </p>
              {profile.username && (
                <p className="text-xs text-muted truncate">@{profile.username}</p>
              )}
            </div>
          </div>
          <div className="user-menu-panel-list">
            <Link href={profileHref} className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              Ver mi perfil
            </Link>
            <Link href="/perfil" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              Mi cuenta
            </Link>
            {isStaff && (
              <Link href="/admin" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
                Panel admin
              </Link>
            )}
            <button type="button" onClick={signOut} className="user-menu-item user-menu-item-danger" role="menuitem">
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
