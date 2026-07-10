import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { listAdminPages } from '@/features/admin/server/pages.server'
import { AdminPagesTable } from '@/features/admin/components/pages/AdminPagesTable'

export const metadata = { title: 'Admin · Páginas' }

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminPaginasPage({ searchParams }: PageProps) {
  await requirePlatformAdmin()
  const sp = await searchParams
  const search = sp.q?.trim() ?? ''
  const pages = await listAdminPages(search)

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Páginas</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Modera páginas de artista/negocio: verificación, privacidad y acceso rápido al perfil
            público. Insignias de página se otorgan desde Insignias.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          {pages.length.toLocaleString('es-ES')} páginas
        </span>
      </header>

      <form method="get" className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Buscar por nombre o slug…"
          className="w-full max-w-sm rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </form>

      <section className="min-w-0 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <AdminPagesTable pages={pages} />
      </section>
    </div>
  )
}
