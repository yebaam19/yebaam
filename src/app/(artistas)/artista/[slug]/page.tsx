import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getOwnArtistProfile } from '@/features/artistas/server/artist.server'
import { ProfileForm } from '@/features/artistas/components/admin/ProfileForm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ArtistaDashboardPage({ params }: Props) {
  const { userId } = await requireSession()
  const { slug } = await params
  const profile = await getOwnArtistProfile(userId, slug)
  if (!profile) notFound()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil Artístico</h1>
      <ProfileForm profile={profile} />
    </main>
  )
}
