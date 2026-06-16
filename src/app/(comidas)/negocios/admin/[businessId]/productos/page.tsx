import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getMyAdminRecord } from '@/features/comidas/server/business.server'
import { getMenusByBusiness } from '@/features/comidas/server/menu.server'
import { ProductForm } from '@/features/comidas/components/admin/ProductForm'
import { PermissionDenied } from '@/features/comidas/components/admin/shared/PermissionDenied'
import { PageHeader } from '@/features/comidas/components/admin/shared/PageHeader'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminProductosPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, adminRecord] = await Promise.all([
    getBusinessById(businessId),
    getMyAdminRecord(businessId),
  ])
  if (!business) notFound()
  if (!adminRecord?.can_manage_menu) {
    return <PermissionDenied businessId={businessId} section="productos" />
  }

  const menus = await getMenusByBusiness(businessId)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Productos"
        subtitle={`Gestiona el catálogo de ${business.name}`}
      />
      <ProductForm businessId={businessId} menus={menus} />
    </main>
  )
}
