'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
        .select('id, display_name, avatar_url, role')
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

  if (!isSupabaseBrowserConfigured()) return null
  if (!ready) return <span className="header-auth-skeleton" aria-hidden />

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setProfile(null)
    router.refresh()
    router.push('/')
  }

  const isDrawer = variant === 'drawer'
  const wrapClass = isDrawer ? 'user-menu-drawer' : 'user-menu-inline'

  if (!profile) {
    return (
      <Link href="/login" className={`btn-ghost text-xs py-2 px-3 ${isDrawer ? 'w-full text-center' : ''}`}>
        Entrar
      </Link>
    )
  }

  const label = profile.display_name?.[0]?.toUpperCase() || '?'
  const isStaff = profile.role === 'editor' || profile.role === 'admin'

  return (
    <div className={wrapClass}>
      {isStaff && (
        <Link
          href="/admin"
          className={`text-xs text-muted hover:text-accent transition ${isDrawer ? 'btn-ghost w-full text-center py-2' : 'px-2'}`}
        >
          Panel admin
        </Link>
      )}
      <div className={`user-menu-profile ${isDrawer ? 'user-menu-profile-drawer' : ''}`}>
        <span
          className="user-avatar"
          title={profile.display_name || 'Cuenta'}
        >
          {label}
        </span>
        {isDrawer && profile.display_name && (
          <span className="text-sm text-text truncate">{profile.display_name}</span>
        )}
        <button type="button" onClick={signOut} className="text-xs text-muted hover:text-text transition">
          Salir
        </button>
      </div>
    </div>
  )
}
