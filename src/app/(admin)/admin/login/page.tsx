import Image from 'next/image'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getServerClient } from '@/utils/supabase/server'
import { isPlatformAdmin } from '@/app/(app)/foro/server/foro.server'
import AdminLoginForm from '@/features/admin/components/AdminLoginForm'
import YebaamLogo from '@/images/brand/Yebaam-Logo.svg'

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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      {/* Decorative gradient backdrop matching brand */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-300/30 blur-3xl dark:bg-primary-700/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl dark:bg-primary-800/10"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
        <header className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 items-center justify-center">
            <Image
              src={YebaamLogo}
              alt="Yebaam"
              priority
              className="h-full w-auto"
              style={{ height: '100%', width: 'auto' }}
            />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Panel de administración
          </h1>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Acceso exclusivo para el equipo
          </p>
        </header>
        <AdminLoginForm initialError={initialError} />
      </div>
    </div>
  )
}
