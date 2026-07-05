import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { getAdminBadgeBySlug } from '@/features/admin/server/badges.server'
import { UserSearchToGrant } from '@/features/admin/components/badges/UserSearchToGrant'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Admin · Asignar insignia' }

export default async function GrantBadgePage({ params }: PageProps) {
  await requirePlatformAdmin()
  const { slug } = await params
  const badge = await getAdminBadgeBySlug(slug)
  if (!badge) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-3 text-xs text-neutral-500">
        <Link href={`/admin/badges/${badge.slug}` as Route} className="hover:underline">
          ← {badge.name}
        </Link>
      </nav>
      <h1 className="mb-5 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Asignar a un usuario
      </h1>
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <UserSearchToGrant
          badgeId={badge.id}
          badgeSlug={badge.slug}
          badgeName={badge.name}
          evidenceRequired={badge.evidenceRequired}
        />
      </div>
    </div>
  )
}
