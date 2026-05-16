import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'
import { listPublicSpaces } from './server/foro.server'
import { Badge } from '@/ui/Badge'
import ForoHeader from '@/features/foro/components/ForoHeader'
import { getOwnerMeta, initialsFrom } from '@/features/foro/utils/owner'

export async function generateMetadata() {
  const t = await getTranslations('foro')
  return {
    title: t('metadata.discoveryTitle'),
  }
}

export default async function ForoDiscoveryPage() {
  const t = await getTranslations('foro')
  const spaces = await listPublicSpaces()

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-4 sm:py-6">
      <ForoHeader
        title={t('discovery.title')}
        subtitle={t('discovery.subtitle')}
      />

      {spaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          {t('discovery.emptyDiscovery')}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => {
            const owner = getOwnerMeta(space.ownerType)
            return (
              <li key={space.id}>
                <Link
                  href={`/foro/${space.slug}` as Route}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md focus-visible:border-primary-500 focus-visible:outline-hidden dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-600"
                >
                  <div
                    aria-hidden
                    className="h-1.5 w-full"
                    style={{ backgroundColor: owner.accent }}
                  />
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                        style={{ backgroundColor: owner.accent }}
                      >
                        {initialsFrom(space.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-semibold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-400">
                          {space.name}
                        </h2>
                        <Badge color={owner.badgeColor} className="mt-1">
                          {owner.label}
                        </Badge>
                      </div>
                    </div>
                    {space.description ? (
                      <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {space.description}
                      </p>
                    ) : (
                      <p className="line-clamp-3 text-sm text-neutral-400 italic">
                        {t('discovery.spaceDescriptionFallback')}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-1 text-xs font-medium text-primary-700 dark:text-primary-400">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      {t('discovery.enterSpace')}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
