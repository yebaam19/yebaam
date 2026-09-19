import { canAccessForumAdmin } from '@/app/(app)/foro/server/foro.server'
import AdminShell from '@/features/admin/components/AdminShell'
import { hasMusicArchiveAdminAccess } from '@/features/music-archive/server/music-authorization.server'
import { getServerClient } from '@/utils/supabase/server'
import type { Route } from 'next'
import { redirect } from 'next/navigation'

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data?.user) {
    redirect('/login?redirect=/admin' as Route)
  }
  const [forumStaff, musicAccess] = await Promise.all([
    canAccessForumAdmin(),
    hasMusicArchiveAdminAccess(client, data.user.id),
  ])
  if (!forumStaff && !musicAccess.allowed) {
    redirect('/feed' as Route)
  }
  return <AdminShell navScope={forumStaff ? 'all' : 'music'}>{children}</AdminShell>
}
