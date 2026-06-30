import VerAnimePageContent, { generateVerAnimeMetadata } from '../../../../components/watch/VerAnimePageContent'

export const revalidate = 3600

type Props = { params: Promise<{ id: string; ep: string }> }

function parseEpisode(raw: string): number {
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

export async function generateMetadata({ params }: Props) {
  const { id, ep } = await params
  return generateVerAnimeMetadata(id, parseEpisode(ep))
}

export default async function VerAnimeEpisodePage({ params }: Props) {
  const { id, ep } = await params
  return <VerAnimePageContent malIdParam={id} episode={parseEpisode(ep)} />
}
