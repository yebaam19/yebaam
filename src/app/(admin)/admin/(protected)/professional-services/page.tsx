import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { listAdminServices } from '@/features/admin/server/professional-services.server'
import { AdminServicesTable } from '@/features/admin/components/professional-services/AdminServicesTable'

export const metadata = { title: 'Admin · Servicios Profesionales' }

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminProfessionalServicesPage({ searchParams }: PageProps) {
  await requirePlatformAdmin()
  const sp = await searchParams
  const search = sp.q?.trim() ?? ''
  const services = await listAdminServices(search)

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Servicios Profesionales</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Supervisa los perfiles de servicios profesionales: encuentra cualquier perfil y ábrelo para revisarlo.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          {services.length.toLocaleString('es-ES')} servicios
        </span>
      </header>

      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
        Suspender oculta el servicio del directorio público y de su página de detalle hasta que un administrador lo
        reactive. El motivo de cada suspensión queda registrado en los logs del servidor.
      </p>

      <form method="get" className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Buscar por nombre, categoría o dirección…"
          className="w-full max-w-sm rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </form>

      <section className="min-w-0 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <AdminServicesTable services={services} />
      </section>
    </div>
  )
}
