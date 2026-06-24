import { redirect } from 'next/navigation'
import AdminFinancePanel from '../../../components/admin/AdminFinancePanel'
import { requireAdmin } from '../../../lib/auth'

export default async function AdminFinanzasPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/admin')
  return <AdminFinancePanel />
}
