import { redirect } from 'next/navigation'
import AdminShell from '../../components/admin/AdminShell'
import { requireEditor } from '../../lib/auth'
import { isSupabaseAuthConfigured } from '../../lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseAuthConfigured()) {
    redirect('/login?error=supabase&next=/admin')
  }

  const profile = await requireEditor()
  if (!profile) {
    redirect('/login?next=/admin')
  }

  const displayName = profile.display_name || profile.username || 'Staff'

  return (
    <AdminShell role={profile.role} displayName={displayName}>
      {children}
    </AdminShell>
  )
}
