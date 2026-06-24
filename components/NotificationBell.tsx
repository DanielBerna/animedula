'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient, isSupabaseBrowserConfigured } from '../lib/supabase/client'

type Notification = {
  id: number
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

type Props = {
  variant?: 'inline' | 'drawer'
}

export default function NotificationBell({ variant = 'inline' }: Props) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/social/notifications')
      if (res.status === 401) {
        setLoggedIn(false)
        setReady(true)
        return
      }
      setLoggedIn(true)
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadNotifications(data.unread_notifications ?? 0)
      setUnreadMessages(data.unread_messages ?? 0)
    } catch {
      // silent
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setReady(true)
      return
    }

    load()

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => load(),
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${user.id}`,
          },
          () => load(),
        )
        .subscribe()
    }

    setupRealtime()

    const onFocus = () => load()
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
      if (channel) supabase.removeChannel(channel)
    }
  }, [load])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!isSupabaseBrowserConfigured() || !ready || !loggedIn) return null

  const totalUnread = unreadNotifications + unreadMessages

  const markRead = async (id: number) => {
    await fetch('/api/social/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read', id }),
    })
    await load()
  }

  const markAllRead = async () => {
    await fetch('/api/social/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read_all' }),
    })
    await load()
  }

  const isDrawer = variant === 'drawer'

  return (
    <div className={`notification-bell-wrap${isDrawer ? ' w-full' : ''}`} ref={panelRef}>
      <button
        type="button"
        className={`notification-bell-btn focus-ring${isDrawer ? ' w-full justify-center' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notificaciones${totalUnread > 0 ? `, ${totalUnread} sin leer` : ''}`}
        aria-expanded={open}
      >
        <span aria-hidden>🔔</span>
        {totalUnread > 0 ? (
          <span className="notification-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
        ) : null}
      </button>

      {open && (
        <div className={`notification-panel${isDrawer ? ' notification-panel-drawer' : ''}`}>
          <div className="notification-panel-head">
            <span className="font-semibold text-sm text-text">Actividad</span>
            {unreadNotifications > 0 ? (
              <button type="button" className="text-xs text-accent hover:underline" onClick={markAllRead}>
                Marcar leídas
              </button>
            ) : null}
          </div>

          {unreadMessages > 0 ? (
            <Link
              href="/comunidad"
              className="notification-msg-hint"
              onClick={() => setOpen(false)}
            >
              💬 {unreadMessages} mensaje{unreadMessages !== 1 ? 's' : ''} sin leer · Ir a Comunidad
            </Link>
          ) : null}

          {notifications.length === 0 ? (
            <p className="text-xs text-muted p-3">Sin notificaciones recientes.</p>
          ) : (
            <ul className="notification-list">
              {notifications.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notification-item${!n.read_at ? ' is-unread' : ''}`}
                    onClick={() => {
                      if (!n.read_at) markRead(n.id)
                      if (n.href) {
                        setOpen(false)
                        window.location.href = n.href
                      }
                    }}
                  >
                    <span className="notification-item-title">{n.title}</span>
                    {n.body ? <span className="notification-item-body">{n.body}</span> : null}
                    <time className="notification-item-time">
                      {new Date(n.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link href="/comunidad" className="notification-panel-foot" onClick={() => setOpen(false)}>
            Ver comunidad →
          </Link>
        </div>
      )}
    </div>
  )
}
