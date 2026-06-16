import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getMyAdminRecord } from '@/features/comidas/server/business.server'
import { getPromotionsByBusiness } from '@/features/comidas/server/promotion.server'
import { PromotionForm } from '@/features/comidas/components/admin/PromotionForm'
import { PermissionDenied } from '@/features/comidas/components/admin/shared/PermissionDenied'
import { PageHeader } from '@/features/comidas/components/admin/shared/PageHeader'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminPromocionesPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, adminRecord] = await Promise.all([
    getBusinessById(businessId),
    getMyAdminRecord(businessId),
  ])
  if (!business) notFound()
  if (!adminRecord?.can_manage_promotions) {
    return <PermissionDenied businessId={businessId} section="promociones" />
  }

  const promotions = await getPromotionsByBusiness(businessId)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Promociones"
        subtitle={`Descuentos y ofertas especiales de ${business.name}`}
      />
      <PromotionForm businessId={businessId} promotions={promotions} />
    </main>
  )
}
