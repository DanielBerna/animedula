"use client"
import React from 'react'

type Props = { open: boolean; onClose: () => void; children: React.ReactNode }

export default function Modal({ open, onClose, children }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card-glass p-6 md:p-7 max-w-lg w-full shadow-card enter-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-white/5 transition focus-ring"
          aria-label="Cerrar"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
