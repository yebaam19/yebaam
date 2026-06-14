'use client'

import { useTranslations } from 'next-intl'
import type { Business } from '../../interfaces/business.interfaces'
import { BusinessDetailPhotos } from '../photos/BusinessDetailPhotos'
import type { BusinessSidebarSection } from './BusinessSidebarNav'

interface Props {
  section: BusinessSidebarSection
  business: Business
  isOwner: boolean
}

/** Defensive shape: `Business.address` is typed as a string, but some legacy
 *  rows arrive as a `{ street, city }` object — handled at render time. */
interface AddressObject {
  street?: string
  city?: string
}

/** Content panel for the active sidebar section (photos, reviews, hours,
 *  contact) on the business profile page. */
export function BusinessSectionPanels({ section, business, isOwner }: Props) {
  const t = useTranslations('businesses')

  if (section === 'fotos') {
    return <BusinessDetailPhotos businessId={business.id} isOwner={isOwner} />
  }

  if (section === 'valoraciones') {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">{t('profile.reviews.title')}</h2>
        <p className="text-neutral-600 dark:text-neutral-400">{t('profile.reviews.comingSoon')}</p>
      </div>
    )
  }

  if (section === 'horarios') {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">{t('profile.hours.title')}</h2>
        {business.hours && Object.keys(business.hours).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(business.hours).map(([day, hoursValue]) => {
              const hourData = typeof hoursValue === 'string' ? JSON.parse(hoursValue) : hoursValue
              return (
                <div
                  key={day}
                  className="flex justify-between border-b border-neutral-200 py-2 dark:border-neutral-700"
                >
                  <span className="font-medium text-neutral-900 capitalize dark:text-white">{day}</span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {hourData?.open || t('profile.hours.closed')} - {hourData?.close || ''}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-400">{t('profile.hours.empty')}</p>
        )}
      </div>
    )
  }

  // section === 'contacto'
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">{t('profile.contact.title')}</h2>
      <div className="space-y-4">
        {business.phone && (
          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('profile.contact.phone')}</h3>
            <p className="mt-1 text-neutral-900 dark:text-white">{business.phone}</p>
          </div>
        )}
        {business.email && (
          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('profile.contact.email')}</h3>
            <p className="mt-1 text-neutral-900 dark:text-white">{business.email}</p>
          </div>
        )}
        {business.website && (
          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('profile.contact.website')}</h3>
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {business.website}
            </a>
          </div>
        )}
        {business.address && (
          <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{t('profile.contact.address')}</h3>
            <p className="mt-1 text-neutral-900 dark:text-white">
              {typeof business.address === 'string'
                ? business.address
                : `${(business.address as unknown as AddressObject).street}, ${(business.address as unknown as AddressObject).city}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
