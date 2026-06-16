import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getBusinessAdmins } from '@/features/comidas/server/business.server'
import { BusinessAdminForm } from '@/features/comidas/components/admin/BusinessAdminForm'
import { PageHeader } from '@/features/comidas/components/admin/shared/PageHeader'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminAdministradoresPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, admins] = await Promise.all([
    getBusinessById(businessId),
    getBusinessAdmins(businessId),
  ])
  if (!business) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Administradores"
        subtitle={`Usuarios con acceso al panel de ${business.name}`}
      />
      <BusinessAdminForm businessId={businessId} admins={admins} />
    </main>
  )
}
