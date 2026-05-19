import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { getDiscoveryThumbnailsAdmin } from '@/features/admin/server/cities.server'
import { DiscoveryThumbnailsManager } from '@/features/admin/components/cities/DiscoveryThumbnailsManager'

export const metadata = { title: 'Admin · Miniaturas del portal' }

export default async function AdminThumbnailsPage() {
  await requirePlatformAdmin()
  const t = await getTranslations('admin.ciudades')
  const thumbnails = await getDiscoveryThumbnailsAdmin()

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link
          href={'/admin/ciudades' as Route}
          className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
        >
          {t('back')}
        </Link>
      </div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {t('thumbnailsTitle')}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('thumbnailsSubtitle')}</p>
      </header>

      <DiscoveryThumbnailsManager thumbnails={thumbnails} />
    </div>
  )
}
