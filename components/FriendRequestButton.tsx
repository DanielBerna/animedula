'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { FriendStatus } from '../lib/social/friends'

type Props = {
  targetUserId: string
  initialStatus?: FriendStatus
  canInteract: boolean
}

export default function FriendRequestButton({
  targetUserId,
  initialStatus = 'none',
  canInteract,
}: Props) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  if (!canInteract) return null

  const act = async (action: 'send' | 'accept' | 'reject' | 'cancel') => {
    setLoading(true)
    try {
      const res = await fetch('/api/social/friends', {
        method: action === 'cancel' || action === 'reject' ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: targetUserId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(data.status || 'none')
    } catch {
      // retry silently
    } finally {
      setLoading(false)
    }
  }

  if (status === 'friends') {
    return (
      <span className="tag tag-accent text-xs">Amigos · puedes escribir en Comunidad</span>
    )
  }

  if (status === 'pending_sent') {
    return (
      <button type="button" disabled={loading} className="btn-ghost text-xs py-2 px-4" onClick={() => act('cancel')}>
        Solicitud enviada
      </button>
    )
  }

  if (status === 'pending_received') {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={loading} className="btn-primary text-xs py-2 px-4" onClick={() => act('accept')}>
          Aceptar amistad
        </button>
        <button type="button" disabled={loading} className="btn-ghost text-xs py-2 px-4" onClick={() => act('reject')}>
          Rechazar
        </button>
      </div>
    )
  }

  return (
    <button type="button" disabled={loading} className="btn-ghost text-xs py-2 px-4" onClick={() => act('send')}>
      Solicitud de amistad
    </button>
  )
}
