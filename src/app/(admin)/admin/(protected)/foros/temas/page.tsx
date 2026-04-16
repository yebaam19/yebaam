import {
  listAdminFilterOptions,
  listAllTopicsAdmin,
} from '@/app/(app)/foro/server/admin.server'
import AdminForosNav from '@/features/foro/components/admin/AdminForosNav'
import TopicsAdminTable from '@/features/foro/components/admin/TopicsAdminTable'

export const metadata = { title: 'Admin · Foros · Temas' }

interface PageProps {
  searchParams: Promise<{
    q?: string
    space?: string
    forum?: string
    author?: string
    pinned?: 'true' | 'false' | ''
    locked?: 'true' | 'false' | ''
    page?: string
  }>
}

export default async function AdminForosTemasPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const [{ spaces, forums }, listed] = await Promise.all([
    listAdminFilterOptions(),
    listAllTopicsAdmin({
      search: sp.q,
      spaceId: sp.space || undefined,
      forumId: sp.forum || undefined,
      authorUsername: sp.author || undefined,
      isPinned: sp.pinned === 'true' ? true : sp.pinned === 'false' ? false : undefined,
      isLocked: sp.locked === 'true' ? true : sp.locked === 'false' ? false : undefined,
      page,
      pageSize: 25,
    }),
  ])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Foros</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Modera temas de cualquier espacio: filtra, fija, cierra, mueve o elimina en lote.
        </p>
      </header>
      <AdminForosNav />
      <TopicsAdminTable initial={listed} spaces={spaces} forums={forums} />
    </div>
  )
}
