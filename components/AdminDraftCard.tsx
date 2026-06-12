"use client"
import React from 'react'
import { useToast } from './ToastProvider'

export default function AdminDraftCard({ title, mal_id, resumen, badge, onApprove, onReject }: { title: string; mal_id: number; resumen?: string; badge?: string; onApprove?: () => void; onReject?: () => void }) {
  const { showToast } = useToast()

  const handleApprove = async () => {
    if (onApprove) return onApprove()
    try {
      const res = await fetch('/api/admin/approve', { method: 'POST', body: JSON.stringify({ mal_id }), headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'error')
      showToast({ title: 'Aprobado', description: `Se publicó ${title}` })
    } catch (err: any) {
      showToast({ title: 'Error', description: err.message || 'No se pudo aprobar' })
    }
  }

  const handleReject = async () => {
    if (onReject) return onReject()
    try {
      const res = await fetch('/api/admin/reject', { method: 'POST', body: JSON.stringify({ mal_id }), headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'error')
      showToast({ title: 'Rechazado', description: `Se rechazó ${title}` })
    } catch (err: any) {
      showToast({ title: 'Error', description: err.message || 'No se pudo rechazar' })
    }
  }

  return (
    <article className="card-glass p-5 flex flex-col justify-between min-h-[180px]">
      <div>
        <div className="flex gap-2 mb-2">
          <span className="tag tag-accent text-[10px]">Borrador</span>
          {badge && <span className="tag tag-gold text-[10px]">{badge}</span>}
        </div>
        <h4 className="font-display font-semibold text-text">{title}</h4>
        <p className="text-sm text-muted mt-2 leading-relaxed">{resumen}</p>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={handleApprove} className="btn-primary text-xs py-2 px-4 flex-1">Aprobar</button>
        <button onClick={handleReject} className="btn-ghost text-xs py-2 px-4 text-sakura border-sakura/30 hover:border-sakura/50">Rechazar</button>
      </div>
    </article>
  )
}
