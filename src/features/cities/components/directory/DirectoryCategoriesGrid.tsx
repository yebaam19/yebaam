import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getDirectoryCategories } from '@/features/cities/server/directory-entries.server'
import { directorySections } from '@/features/cities/directory/types'
import { getPortalIcon } from '../portal/icons'

/** Real directory categories link to the entries of the selected city. */
export async function DirectoryCategoriesGrid({ citySlug }: { citySlug: string }) {
  const [categories, t] = await Promise.all([
    getDirectoryCategories(), getTranslations('cities.portal.sections'),
  ])
  const links = [
    { id: 'businesses', label: 'Negocios', icon: 'BuildingStorefrontIcon', href: `/cities/${citySlug}/directory/businesses` },
    { id: 'services', label: 'Servicios profesionales', icon: 'BuildingLibraryIcon', href: `/cities/${citySlug}/directory/services` },
    ...categories.map((category) => ({
      id: category.slug, label: t(`${category.slug}.label`),
      icon: directorySections.find((s) => s.id === category.slug)?.icon ?? 'BuildingLibraryIcon',
      href: `/cities/${citySlug}/directory/${category.slug}`,
    })),
  ]
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    {links.map((item) => {
      const Icon = getPortalIcon(item.icon)
      return <Link key={item.id} href={item.href as `/${string}`}
        className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-white p-5 text-center hover:border-primary-600 focus-visible:outline-2 focus-visible:outline-primary-600 dark:border-neutral-700 dark:bg-neutral-800">
        <Icon className="size-10 text-primary-600" />
        <span className="text-sm font-semibold">{item.label}</span>
      </Link>
    })}
  </div>
}
