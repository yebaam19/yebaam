'use client'

import { useTranslations } from 'next-intl'

export type BusinessSidebarSection = 'fotos' | 'valoraciones' | 'horarios' | 'contacto'

const SECTIONS: ReadonlyArray<{ id: BusinessSidebarSection; labelKey: string; iconPath: string }> = [
  {
    id: 'fotos',
    labelKey: 'profile.sections.photos',
    iconPath:
      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    id: 'valoraciones',
    labelKey: 'profile.sections.reviews',
    iconPath:
      'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
  {
    id: 'horarios',
    labelKey: 'profile.sections.hours',
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'contacto',
    labelKey: 'profile.sections.contact',
    iconPath:
      'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
]

interface Props {
  activeSection: BusinessSidebarSection | null
  onSelect: (section: BusinessSidebarSection) => void
}

/** The right-hand "sections" navigation on the business profile page. The four
 *  buttons share one config-driven template instead of repeating identical
 *  markup + inline SVGs. */
export function BusinessSidebarNav({ activeSection, onSelect }: Props) {
  const t = useTranslations('businesses')
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-20">
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-800">
          <h3 className="mb-3 text-sm font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            {t('profile.sectionsLabel')}
          </h3>
          <nav className="space-y-1">
            {SECTIONS.map(({ id, labelKey, iconPath }) => (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                </svg>
                {t(labelKey)}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
