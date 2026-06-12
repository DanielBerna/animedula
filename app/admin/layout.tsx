import { redirect } from 'next/navigation'
import { isEditorRole, requireEditor } from '../../lib/auth'
import { isSupabaseAuthConfigured } from '../../lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseAuthConfigured()) {
    redirect('/login?error=supabase&next=/admin')
  }

  const profile = await requireEditor()
  if (!profile) {
    redirect('/login?next=/admin')
  }

  return (
    <div data-admin-role={profile.role}>
      {children}
    </div>
  )
}
