import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getMyAdminRecord } from '@/features/comidas/server/business.server'
import { getMenusByBusiness } from '@/features/comidas/server/menu.server'
import { ProductForm } from '@/features/comidas/components/admin/ProductForm'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminProductosPage({ params }: Props) {
  const { userId } = await requireSession()
  const { businessId } = await params

  const [business, adminRecord] = await Promise.all([
    getBusinessById(businessId),
    getMyAdminRecord(businessId, userId),
  ])
  if (!business) notFound()

  if (!adminRecord?.can_manage_menu) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <p className="text-2xl mb-3">🔒</p>
        <h1 className="text-lg font-semibold text-neutral-900">Sin permiso</h1>
        <p className="mt-2 text-sm text-neutral-500">
          No tienes permiso para gestionar productos de este negocio.
        </p>
      </main>
    )
  }

  const menus = await getMenusByBusiness(businessId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Productos — {business.name}</h1>
      <ProductForm businessId={businessId} menus={menus} />
    </main>
  )
}
