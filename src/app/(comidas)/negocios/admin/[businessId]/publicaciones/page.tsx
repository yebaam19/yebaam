import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getMyAdminRecord } from '@/features/comidas/server/business.server'
import { CreateBusinessPostButton } from '@/features/comidas/components/admin/CreateBusinessPostButton'
import { BusinessSocialFeed } from '@/features/comidas/components/public/detail/BusinessSocialFeed'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminPublicacionesPage({ params }: Props) {
  const { userId } = await requireSession()
  const { businessId } = await params

  const [business, adminRecord] = await Promise.all([
    getBusinessById(businessId),
    getMyAdminRecord(businessId, userId),
  ])
  if (!business) notFound()

  if (!adminRecord?.can_manage_posts) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <p className="text-2xl mb-3">🔒</p>
        <h1 className="text-lg font-semibold text-neutral-900">Sin permiso</h1>
        <p className="mt-2 text-sm text-neutral-500">
          No tienes permiso para gestionar publicaciones de este negocio.
        </p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Publicaciones — {business.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cada publicación aparece en el perfil del negocio y en el feed de tus seguidores.
          </p>
        </div>
        <CreateBusinessPostButton businessId={businessId} businessName={business.name} businessSlug={business.slug} />
      </div>

      <BusinessSocialFeed businessId={businessId} adminBusinessId={businessId} />
    </main>
  )
}
