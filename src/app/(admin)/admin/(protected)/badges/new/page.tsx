import Link from 'next/link'
import type { Route } from 'next'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { BadgeForm } from '@/features/admin/components/badges/BadgeForm'

export const metadata = { title: 'Admin · Nueva insignia' }

export default async function NewBadgePage() {
  await requirePlatformAdmin()
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-3 text-xs text-neutral-500">
        <Link href={'/admin/badges' as Route} className="hover:underline">
          ← Insignias
        </Link>
      </nav>
      <h1 className="mb-5 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Nueva insignia</h1>
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <BadgeForm mode="create" />
      </div>
    </div>
  )
}
