"use client"
import React, { useState } from 'react'
import Modal from './Modal'
import PosterImage from './PosterImage'

export default function Gallery({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  const [open, setOpen] = useState(false)
  if (!images || images.length === 0) return <div className="h-64 bg-surface-4 rounded-xl" />

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length)
  const next = () => setIdx((i) => (i + 1) % images.length)

  return (
    <div>
      <div
        className="relative rounded-xl overflow-hidden border border-white/8 shadow-card cursor-pointer group h-72 md:h-80"
        onClick={() => setOpen(true)}
      >
        <PosterImage
          src={images[idx]}
          alt={`Imagen ${idx + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {images.length > 1 && (
          <>
            <button aria-label="Anterior" onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white rounded-full border border-white/10 hover:bg-black/70 transition">◀</button>
            <button aria-label="Siguiente" onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white rounded-full border border-white/10 hover:bg-black/70 transition">▶</button>
          </>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <PosterImage
          src={images[idx]}
          alt={`Imagen ampliada ${idx + 1}`}
          width={1200}
          height={800}
          sizes="100vw"
          className="w-full h-auto rounded-xl"
        />
        {images.length > 1 && (
          <div className="mt-4 flex justify-between items-center text-sm text-muted">
            <span>{idx + 1} / {images.length}</span>
            <div className="flex gap-2">
              <button onClick={prev} className="btn-ghost text-xs py-1.5 px-3">Anterior</button>
              <button onClick={next} className="btn-ghost text-xs py-1.5 px-3">Siguiente</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
