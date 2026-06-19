'use client'

import { useState } from 'react'

type Props = {
  children: React.ReactNode
  isSpoiler: boolean
}

export default function SpoilerText({ children, isSpoiler }: Props) {
  const [revealed, setRevealed] = useState(false)

  if (!isSpoiler) {
    return <p className="text-sm text-text leading-relaxed whitespace-pre-line">{children}</p>
  }

  return (
    <div className="relative">
      {!revealed && (
        <p className="text-xs text-faint mb-1">Contiene spoilers · Toca para revelar</p>
      )}
      <p
        role="button"
        tabIndex={0}
        className={`text-sm text-text leading-relaxed whitespace-pre-line spoiler-blur${revealed ? ' is-revealed' : ''}`}
        onClick={() => setRevealed(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setRevealed(true)
          }
        }}
      >
        {children}
      </p>
    </div>
  )
}
