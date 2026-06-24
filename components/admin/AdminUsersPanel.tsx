'use client'

import { useEffect, useState } from 'react'
import { useToast } from '../../components/ToastProvider'

type UserRow = {
  id: string
  username: string | null
  display_name: string | null
  role: string
  level: number
  is_premium: boolean
  created_at: string
}

export default function AdminUsersPanel() {
  const { showToast } = useToast()
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)

  const load = (query = q) => {
    setLoading(true)
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    fetch(`/api/admin/users${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load('')
  }, [])

  const updateRole = async (userId: string, role: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    })
    const data = await res.json()
    if (!res.ok) {
      showToast({ title: 'Error', description: data.error })
      return
    }
    showToast({ title: 'Actualizado', description: `Rol → ${role}` })
    load()
  }

  return (
    <div className="admin-page space-y-6">
      <header>
        <p className="eyebrow mb-1">Comunidad</p>
        <h1 className="page-title">Usuarios</h1>
        <p className="text-sm text-muted mt-2">Gestiona roles y premium. Solo administradores.</p>
      </header>
      <div className="flex gap-2 max-w-md">
        <input
          className="input flex-1 text-sm"
          placeholder="Buscar por usuario o nombre"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button type="button" className="btn-ghost text-xs" onClick={() => load()}>
          Buscar
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <div className="overflow-x-auto card-glass">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Nivel</th>
                <th>Premium</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <p className="font-medium">{u.display_name || '—'}</p>
                    <p className="text-[10px] text-faint">@{u.username || u.id.slice(0, 8)}</p>
                  </td>
                  <td>
                    <span className="tag text-[10px]">{u.role}</span>
                  </td>
                  <td>{u.level}</td>
                  <td>{u.is_premium ? 'Sí' : 'No'}</td>
                  <td>
                    <select
                      className="input text-xs py-1"
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="contributor">contributor</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
