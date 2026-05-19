import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  PORTAL_SECTIONS,
  resolveHref,
} from '@/features/cities/data/portal-sections'
import { getCityPortalData } from '@/features/cities/server/portal-data.server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'

interface Props {
  city: AdminCityDetail
}

const COUNT_KEY_BY_SECTION: Partial<Record<string, keyof Awaited<ReturnType<typeof getCityPortalData>>>> = {
  news: 'newsCount',
  promotions: 'promotionCount',
  classifieds: 'classifiedCount',
  'social-help': 'socialHelpCount',
  places: 'placeCount',
  forums: 'forumCount',
  directories: 'businessCount',
  'clubs-blogs': 'communityCount',
}

/**
 * Per-section quick links + counts. The moderation tabs (news, classifieds,
 * contact) link back into themselves on this same edit view; everything
 * else opens the public page in a new tab. Pure RSC, no JS.
 */
export async function CityFeatureLinks({ city }: Props) {
  const t = await getTranslations('admin.ciudades')
  const tSections = await getTranslations('cities.portal.sections')
  const counts = await getCityPortalData(city.id)

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('featuresHeading')}
        </h2>
        <p className="text-xs text-neutral-500">
          {t('featuresSubtitle', { slug: city.slug })}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-sm">
          <tbody>
            {PORTAL_SECTIONS.map((section) => {
              const countKey = COUNT_KEY_BY_SECTION[section.id]
              const count = countKey ? counts[countKey] : undefined
              const publicHref = resolveHref(section, city.slug)
              const adminHref = adminLinkFor(section.id, city.slug)
              return (
                <tr
                  key={section.id}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                >
                  <td className="px-3 py-3">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {tSections(`${section.id}.label`)}
                    </div>
                    <div className="text-xs text-neutral-500">/{section.id}</div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-200">
                    {typeof count === 'number' ? count.toLocaleString('es-ES') : '—'}
                  </td>
                  <td className="px-3 py-3 text-center text-xs">
                    {section.comingSoon ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {t('comingSoonPill')}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={publicHref as `/${string}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        {t('featurePublicLink')}
                      </Link>
                      {adminHref && (
                        <Link
                          href={adminHref}
                          className="rounded-md bg-primary-600 px-2 py-1 text-xs font-semibold text-white hover:bg-primary-500"
                        >
                          {t('featureAdminLink')}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function adminLinkFor(sectionId: string, citySlug: string): Route | null {
  switch (sectionId) {
    case 'news':
      return `/admin/ciudades/${citySlug}?tab=news` as Route
    case 'classifieds':
      return `/admin/ciudades/${citySlug}?tab=classifieds` as Route
    case 'contact':
      return `/admin/ciudades/${citySlug}?tab=contact` as Route
    case 'forums':
      return '/admin/foros' as Route
    case 'chats':
      return '/admin/chat-publico' as Route
    default:
      return null
  }
}
