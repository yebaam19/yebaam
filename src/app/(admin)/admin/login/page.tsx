import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getServerClient } from '@/utils/supabase/server'
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server'
import AdminLoginForm from '@/features/admin/components/AdminLoginForm'

export const metadata = { title: 'Iniciar sesión' }

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Esta cuenta no tiene acceso al panel de administración.',
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  // If already authenticated AND staff, skip the form
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (data?.user) {
    const staff = await isPlatformAdmin()
    if (staff) redirect('/admin' as Route)
  }

  const initialError = error ? ERROR_MESSAGES[error] ?? null : null

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <span className="text-lg font-bold">Y</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Yebaam Admin
          </h1>
          <p className="mt-1 text-xs text-neutral-500">Panel de administración</p>
        </header>
        <AdminLoginForm initialError={initialError} />
      </div>
    </div>
  )
}
