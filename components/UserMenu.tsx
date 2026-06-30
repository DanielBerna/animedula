'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseBrowserConfigured } from '../lib/supabase/client'
import type { Profile } from '../lib/auth'
import AvatarFrame from './AvatarFrame'

type Props = {
  variant?: 'inline' | 'drawer'
}

type Border = { cssClass?: string | null; image?: string | null } | null

export default function UserMenu({ variant = 'inline' }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [border, setBorder] = useState<Border>(null)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
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
      try {
        const res = await fetch('/api/me/cosmetic')
        const json = await res.json()
        setBorder(json.border || null)
      } catch {
        setBorder(null)
      }
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
        <button
          type="button"
          className="user-menu-drawer-toggle"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-expanded={drawerOpen}
        >
          <AvatarFrame avatarUrl={profile.avatar_url} label={profile.display_name || '?'} border={border} size={32} />
          <span className="text-sm text-text truncate flex-1 text-left">{profile.display_name || 'Mi cuenta'}</span>
          <span className={`user-menu-drawer-caret${drawerOpen ? ' is-open' : ''}`} aria-hidden>▾</span>
        </button>
        {drawerOpen && (
          <div className="user-menu-drawer-items">
            <Link href={profileHref} className="btn-ghost w-full text-center py-2 text-xs">
              Ver mi perfil
            </Link>
            <Link href="/biblioteca" className="btn-ghost w-full text-center py-2 text-xs">
              Mi biblioteca
            </Link>
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
        )}
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
        <AvatarFrame avatarUrl={profile.avatar_url} label={profile.display_name || '?'} border={border} size={32} />
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-panel-head">
            <AvatarFrame avatarUrl={profile.avatar_url} label={profile.display_name || '?'} border={border} size={40} />
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
            <Link href="/biblioteca" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
              Mi biblioteca
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
