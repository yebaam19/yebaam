import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getOwnArtistProfile } from '@/features/artistas/server/artist.server'
import { getServiceOffers } from '@/features/artistas/server/artist.server'
import { ServiceForm } from '@/features/artistas/components/admin/ServiceForm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ArtistaServiciosPage({ params }: Props) {
  const { userId } = await requireSession()
  const { slug } = await params
  const profile = await getOwnArtistProfile(userId, slug)
  if (!profile) notFound()

  const services = await getServiceOffers(profile.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Servicios — {profile.stage_name}</h1>
      <ServiceForm profileId={profile.id} services={services} />
    </main>
  )
}
