import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getMyAdminRecord } from '@/features/comidas/server/business.server'
import { getMediaByBusiness } from '@/features/comidas/server/media.server'
import { MediaUploader } from '@/features/comidas/components/admin/MediaUploader'
import { PermissionDenied } from '@/features/comidas/components/admin/shared/PermissionDenied'
import { PageHeader } from '@/features/comidas/components/admin/shared/PageHeader'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminMediaPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, adminRecord] = await Promise.all([
    getBusinessById(businessId),
    getMyAdminRecord(businessId),
  ])
  if (!business) notFound()
  if (!adminRecord?.can_manage_media) {
    return <PermissionDenied businessId={businessId} section="galería multimedia" />
  }

  const media = await getMediaByBusiness(businessId)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Galería"
        subtitle={`Fotos y videos de ${business.name}`}
      />
      <MediaUploader businessId={businessId} existing={media} />
    </main>
  )
}
