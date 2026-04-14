import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getServerClient } from '@/utils/supabase/server'
import { canAccessForumAdmin } from '@/app/(app)/foro/server/foro.server'
import AdminShell from '@/features/admin/components/AdminShell'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data?.user) {
    redirect('/login?redirect=/admin' as Route)
  }
  const staff = await canAccessForumAdmin()
  if (!staff) {
    redirect('/feed' as Route)
  }
  return <AdminShell>{children}</AdminShell>
}
