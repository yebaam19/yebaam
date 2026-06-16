import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById } from '@/features/comidas/server/business.server'
import { getBusinessAdmins } from '@/features/comidas/server/business.server'
import { BusinessAdminForm } from '@/features/comidas/components/admin/BusinessAdminForm'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminAdministradoresPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params
  const business = await getBusinessById(businessId)
  if (!business) notFound()

  const admins = await getBusinessAdmins(businessId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administradores — {business.name}</h1>
      <BusinessAdminForm businessId={businessId} admins={admins} />
    </main>
  )
}
