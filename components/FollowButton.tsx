'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Props = {
  targetUserId: string
  initialFollowing?: boolean
  initialFollowerCount?: number
  canFollow: boolean
}

export default function FollowButton({
  targetUserId,
  initialFollowing = false,
  initialFollowerCount = 0,
  canFollow,
}: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFollowing(initialFollowing)
    setFollowerCount(initialFollowerCount)
  }, [initialFollowing, initialFollowerCount])

  if (!canFollow) {
    return (
      <p className="text-sm text-muted">
        <span className="font-semibold text-text">{followerCount}</span> seguidores
      </p>
    )
  }

  const toggle = async () => {
    setLoading(true)
    try {
      const res = following
        ? await fetch(`/api/social/follow?user_id=${encodeURIComponent(targetUserId)}`, { method: 'DELETE' })
        : await fetch('/api/social/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ following_id: targetUserId }),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setFollowing(data.is_following)
      setFollowerCount(data.follower_count ?? followerCount)
    } catch {
      // silent — user can retry
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={following ? 'btn-ghost text-xs py-2 px-4' : 'btn-primary text-xs py-2 px-4'}
      >
        {loading ? '…' : following ? 'Siguiendo' : 'Seguir'}
      </button>
      <p className="text-sm text-muted">
        <span className="font-semibold text-text">{followerCount}</span> seguidores
      </p>
    </div>
  )
}
