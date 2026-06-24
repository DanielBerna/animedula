import { redirect } from 'next/navigation'

export default function AdminUgcRedirect() {
  redirect('/admin/resenas?tab=ugc')
}
