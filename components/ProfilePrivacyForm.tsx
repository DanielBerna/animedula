'use client'

type Props = {
  isPublic: boolean
  listPublic: boolean
}

export default function ProfilePrivacyForm({ isPublic, listPublic }: Props) {
  const toggle = async (field: 'is_public' | 'list_public', value: boolean) => {
    await fetch('/api/profile/username', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-text text-sm">Privacidad</h3>
      <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={isPublic}
          onChange={(e) => toggle('is_public', e.target.checked)}
          className="rounded border-white/20"
        />
        Perfil público visible en /u/usuario
      </label>
      <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={listPublic}
          onChange={(e) => toggle('list_public', e.target.checked)}
          className="rounded border-white/20"
        />
        Mostrar mi lista (viendo / completado) en el perfil público
      </label>
    </div>
  )
}
