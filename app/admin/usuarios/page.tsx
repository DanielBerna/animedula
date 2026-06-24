import { redirect } from 'next/navigation'
import AdminUsersPanel from '../../../components/admin/AdminUsersPanel'
import { requireAdmin } from '../../../lib/auth'

export default async function AdminUsuariosPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/admin')
  return <AdminUsersPanel />
}
