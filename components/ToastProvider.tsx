"use client"
import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: string; title: string; description?: string }

type ToastContextValue = { showToast: (t: Omit<Toast, 'id'>) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((s) => [{ id, ...t }, ...s])
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card-glass p-4 shadow-glow enter-up border border-white/10"
            role="status"
          >
            <strong className="block font-display text-sm text-text">{t.title}</strong>
            {t.description && <p className="text-sm text-muted mt-1">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
