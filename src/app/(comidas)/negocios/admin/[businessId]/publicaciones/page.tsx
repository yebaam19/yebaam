import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getMyAdminRecord } from '@/features/comidas/server/business.server'
import { CreateBusinessPostButton } from '@/features/comidas/components/admin/CreateBusinessPostButton'
import { BusinessSocialFeed } from '@/features/comidas/components/public/detail/BusinessSocialFeed'
import { PermissionDenied } from '@/features/comidas/components/admin/shared/PermissionDenied'
import { PageHeader } from '@/features/comidas/components/admin/shared/PageHeader'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminPublicacionesPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, adminRecord] = await Promise.all([
    getBusinessById(businessId),
    getMyAdminRecord(businessId),
  ])
  if (!business) notFound()
  if (!adminRecord?.can_manage_posts) {
    return <PermissionDenied businessId={businessId} section="publicaciones" />
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Publicaciones"
        subtitle="Cada publicación aparece en el feed de tus seguidores"
        action={
          <CreateBusinessPostButton
            businessId={businessId}
            businessName={business.name}
            businessSlug={business.slug}
          />
        }
      />
      <BusinessSocialFeed businessId={businessId} adminBusinessId={businessId} />
    </main>
  )
}
