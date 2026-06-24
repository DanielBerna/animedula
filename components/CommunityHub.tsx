'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient, isSupabaseBrowserConfigured } from '../lib/supabase/client'

type Friend = { id: string; username: string | null; display_name: string | null }
type Message = {
  id: number
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
}
type Notification = {
  id: number
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

type Props = {
  userId: string
}

export default function CommunityHub({ userId }: Props) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadFriends = useCallback(() => {
    fetch('/api/social/friends')
      .then((r) => r.json())
      .then((d) => setFriends(d.friends || []))
      .catch(() => {})
  }, [])

  const loadNotifications = useCallback(() => {
    fetch('/api/social/notifications')
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {})
  }, [])

  const loadMessages = useCallback(async (friendId: string) => {
    const res = await fetch(`/api/social/messages?with=${encodeURIComponent(friendId)}`)
    const data = await res.json()
    setMessages(data.messages || [])
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    loadFriends()
    loadNotifications()
  }, [loadFriends, loadNotifications])

  useEffect(() => {
    if (!selectedFriend) {
      setMessages([])
      return
    }
    loadMessages(selectedFriend)
  }, [selectedFriend, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return

    const supabase = createClient()
    const channel = supabase
      .channel(`dm-hub-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const row = payload.new as Message
          const isMine = row.sender_id === userId || row.recipient_id === userId
          if (!isMine) return

          const otherId = row.sender_id === userId ? row.recipient_id : row.sender_id

          if (selectedFriend && otherId === selectedFriend) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev
              return [...prev, row]
            })
            if (row.recipient_id === userId) {
              loadMessages(selectedFriend)
            }
          } else if (row.recipient_id === userId) {
            loadNotifications()
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `addressee_id=eq.${userId}`,
        },
        () => {
          loadFriends()
          loadNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, selectedFriend, loadNotifications, loadFriends])

  const send = async () => {
    if (!selectedFriend || !draft.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: selectedFriend, body: draft.trim() }),
      })
      if (res.ok) {
        setDraft('')
        const data = await res.json()
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
      }
    } finally {
      setSending(false)
    }
  }

  const selected = friends.find((f) => f.id === selectedFriend)

  return (
    <div className="community-hub space-y-6">
      {notifications.filter((n) => !n.read_at).length > 0 && (
        <section>
          <h3 className="font-display text-sm font-semibold text-text mb-2">Notificaciones</h3>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {notifications
              .filter((n) => !n.read_at)
              .slice(0, 5)
              .map((n) => (
                <li key={n.id} className="text-xs rounded-lg border border-white/6 p-2 bg-surface-3/40">
                  {n.href ? (
                    <Link href={n.href} className="text-accent hover:underline font-medium">
                      {n.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-text">{n.title}</span>
                  )}
                  {n.body ? <p className="text-muted mt-0.5">{n.body}</p> : null}
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="font-display text-sm font-semibold text-text mb-2">Mensajes</h3>
        {friends.length === 0 ? (
          <p className="text-xs text-muted">
            Acepta solicitudes de amistad para chatear. Envía solicitudes desde perfiles públicos.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {friends.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`track-list-chip text-xs${selectedFriend === f.id ? ' is-active' : ''}`}
                  onClick={() => setSelectedFriend(f.id)}
                >
                  {f.display_name || f.username || 'Fan'}
                </button>
              ))}
            </div>
            {selectedFriend && selected ? (
              <div className="rounded-lg border border-white/6 bg-surface-3/30 p-3">
                <p className="text-xs text-faint mb-2">
                  Chat en vivo con{' '}
                  {selected.username ? (
                    <Link href={`/u/${selected.username}`} className="text-accent">
                      @{selected.username}
                    </Link>
                  ) : (
                    selected.display_name
                  )}
                </p>
                <ul className="space-y-2 max-h-48 overflow-y-auto mb-3 text-sm">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={`rounded px-2 py-1.5 text-xs ${
                        m.sender_id === userId ? 'bg-accent/15 ml-6 text-right' : 'bg-surface-3 mr-6'
                      }`}
                    >
                      {m.body}
                    </li>
                  ))}
                  <div ref={messagesEndRef} />
                </ul>
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escribe un mensaje…"
                    className="flex-1 text-xs p-2 rounded bg-surface-3 border border-white/8 text-text"
                    maxLength={2000}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  />
                  <button type="button" disabled={sending} className="btn-primary text-xs px-3" onClick={send}>
                    Enviar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">Elige un amigo para abrir el chat.</p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
