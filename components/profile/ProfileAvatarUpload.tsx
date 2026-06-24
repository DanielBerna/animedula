'use client'

import { useRef, useState } from 'react'

type Props = {
  initialUrl: string | null
  displayName: string
}

export default function ProfileAvatarUpload({ initialUrl, displayName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initial = displayName[0]?.toUpperCase() || '?'

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir')
      setUrl(data.avatar_url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="profile-avatar-upload">
      <div className="profile-avatar-ring">
        <span className="profile-avatar">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="profile-avatar-img" />
          ) : (
            initial
          )}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="font-display font-semibold text-text text-sm">Foto de perfil</h3>
        <p className="text-xs text-muted mt-1">JPG, PNG o WebP · máximo 2 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFile}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-ghost text-xs mt-3"
        >
          {uploading ? 'Subiendo…' : url ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
      </div>
    </div>
  )
}
