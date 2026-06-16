import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getOwnArtistProfile } from '@/features/artistas/server/artist.server'
import { getPortfolioByProfile } from '@/features/artistas/server/portfolio.server'
import { PortfolioUploader } from '@/features/artistas/components/admin/PortfolioUploader'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ArtistaPortafolioPage({ params }: Props) {
  const { userId } = await requireSession()
  const { slug } = await params
  const profile = await getOwnArtistProfile(userId, slug)
  if (!profile) notFound()

  const items = await getPortfolioByProfile(profile.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Portafolio — {profile.stage_name}</h1>
      <PortfolioUploader profileId={profile.id} items={items} />
    </main>
  )
}
