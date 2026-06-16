import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getOwnArtistProfile } from '@/features/artistas/server/artist.server'
import { getIncomingRequests } from '@/features/artistas/server/request.server'
import { RequestsPanel } from '@/features/artistas/components/admin/RequestsPanel'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ArtistaSolicitudesPage({ params }: Props) {
  const { userId } = await requireSession()
  const { slug } = await params
  const profile = await getOwnArtistProfile(userId, slug)
  if (!profile) notFound()

  const requests = await getIncomingRequests(profile.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Solicitudes — {profile.stage_name}</h1>
      <RequestsPanel profileId={profile.id} requests={requests} />
    </main>
  )
}
