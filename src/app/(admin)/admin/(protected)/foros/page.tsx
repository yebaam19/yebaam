import {
  listForumOwnerCandidates,
  listPlatformAdmins,
} from '@/app/(app)/foro/server/admin.server'
import OwnersTable from '@/features/foro/components/admin/OwnersTable'
import PlatformStaffPanel from '@/features/foro/components/admin/PlatformStaffPanel'

export const metadata = { title: 'Admin · Foros' }

export default async function AdminForosPage() {
  const [candidates, staff] = await Promise.all([
    listForumOwnerCandidates(),
    listPlatformAdmins(),
  ])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Foros</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Habilita foros por perfil y gestiona el equipo de administradores.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <OwnersTable initial={candidates} />
        <PlatformStaffPanel initial={staff} />
      </div>
    </div>
  )
}
