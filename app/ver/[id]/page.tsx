import { redirect } from 'next/navigation'

export const revalidate = 3600

type Props = { params: Promise<{ id: string }> }

/** /ver/62601 → /ver/62601/1 (episodio en la URL para compartir enlaces). */
export default async function VerAnimeRedirectPage({ params }: Props) {
  const { id } = await params
  redirect(`/ver/${id}/1`)
}
