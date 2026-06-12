"use client"

import { useState } from 'react'
import Modal from './Modal'
import { useToast } from './ToastProvider'

export default function ReportButton() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const { showToast } = useToast()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(false)
    showToast({ title: 'Contenido reportado', description: 'Gracias — revisaremos y actuaremos si procede.' })
    setReason('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-faint hover:text-sakura transition focus-ring rounded mt-4"
      >
        Reportar contenido
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h3 className="font-display text-lg font-semibold mb-1">Reportar contenido</h3>
        <p className="text-sm text-muted mb-4">Cuéntanos qué está mal con esta ficha.</p>
        <form onSubmit={submit} className="space-y-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe el problema…"
            className="w-full p-3 bg-surface-3 border border-white/8 rounded-lg text-sm text-text placeholder:text-faint focus:outline-none focus:border-accent/50 min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm py-2 px-4">Cancelar</button>
            <button type="submit" className="btn-primary text-sm py-2 px-4">Enviar</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
