import {
  listForumGlobalStaff,
  listForumOwnerCandidates,
} from '@/app/(app)/foro/server/admin.server'
import { getTranslations } from 'next-intl/server'
import OwnersTable from '@/features/foro/components/admin/OwnersTable'
import PlatformStaffPanel from '@/features/foro/components/admin/PlatformStaffPanel'
import AdminForosNav from '@/features/foro/components/admin/AdminForosNav'

export const metadata = { title: 'Admin · Foros' }

export default async function AdminForosPage() {
  const [candidates, staff, t] = await Promise.all([
    listForumOwnerCandidates(),
    listForumGlobalStaff(),
    getTranslations('admin.foros'),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
          {t('subtitle')}
        </p>
      </header>
      <AdminForosNav />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <OwnersTable initial={candidates} />
        </div>
        <div className="min-w-0">
          <PlatformStaffPanel initial={staff} />
        </div>
      </div>
    </div>
  )
}
