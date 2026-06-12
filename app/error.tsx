'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[animedula-error]', error)
  }, [error])

  return (
    <div className="card-glass p-8 md:p-10 text-center max-w-lg mx-auto enter-up">
      <p className="eyebrow mb-2">Error</p>
      <h1 className="font-display text-2xl font-bold text-text">Algo falló</h1>
      <p className="text-muted text-sm mt-3 leading-relaxed">
        Puede ser la API de anime, caché del servidor o una compilación interrumpida.
        Prueba recargar o reiniciar el servidor de desarrollo.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary text-sm">
          Reintentar
        </button>
        <Link href="/" className="btn-ghost text-sm">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
