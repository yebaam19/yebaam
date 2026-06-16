import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getOwnArtistProfile } from '@/features/artistas/server/artist.server'
import { getMyOpportunities } from '@/features/artistas/server/opportunity.server'
import { OpportunityForm } from '@/features/artistas/components/admin/OpportunityForm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ArtistaOportunidadesPage({ params }: Props) {
  const { userId } = await requireSession()
  const { slug } = await params
  const profile = await getOwnArtistProfile(userId, slug)
  if (!profile) notFound()

  const opportunities = await getMyOpportunities(userId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis Oportunidades</h1>
      <OpportunityForm profileId={profile.id} opportunities={opportunities} />
    </main>
  )
}
