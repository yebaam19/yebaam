import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getMyAdminRecord } from '@/features/comidas/server/business.server'
import { BusinessForm } from '@/features/comidas/components/admin/BusinessForm'
import { PermissionDenied } from '@/features/comidas/components/admin/shared/PermissionDenied'
import { PageHeader } from '@/features/comidas/components/admin/shared/PageHeader'
import { BusinessStatusToggle } from '@/features/comidas/components/admin/settings/BusinessStatusToggle'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminSettingsPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, adminRecord] = await Promise.all([
    getBusinessById(businessId),
    getMyAdminRecord(businessId),
  ])
  if (!business) notFound()
  if (!adminRecord?.can_edit_business) {
    return <PermissionDenied businessId={businessId} section="la configuración" />
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader
        title="Configuración"
        subtitle={`Perfil y ajustes de ${business.name}`}
      />

      {/* Estado del negocio */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Estado
        </h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-neutral-900">Negocio visible al público</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Cuando está desactivado, el perfil no aparece en búsquedas ni en el directorio.
              </p>
            </div>
            <BusinessStatusToggle
              businessId={businessId}
              isActive={business.is_active}
            />
          </div>
        </div>
      </section>

      {/* Perfil del negocio */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Perfil
        </h2>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
          <BusinessForm business={business} />
        </div>
      </section>
    </main>
  )
}
