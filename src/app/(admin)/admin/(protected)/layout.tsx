import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getServerClient } from '@/utils/supabase/server'
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server'
import AdminShell from '@/features/admin/components/AdminShell'

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data?.user) {
    redirect('/admin/login' as Route)
  }
  const staff = await isPlatformAdmin()
  if (!staff) {
    redirect('/admin/login?error=forbidden' as Route)
  }
  return <AdminShell>{children}</AdminShell>
}
