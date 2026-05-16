'use client'

import { useAuthStore } from '@/features/auth/store/auth.store'
import { BusinessDetailPhotos, BusinessProfileContainer } from '@/features/businesses'
import { useBusinessBySlug } from '@/features/businesses/hooks'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

type TabType = 'inicio' | 'acerca-de'

type SidebarSection = 'fotos' | 'valoraciones' | 'horarios' | 'contacto'

export default function BusinessProfilePage() {
  const t = useTranslations('businesses')
  const params = useParams()
  const businessSlug = params.slug as string
  const [activeTab, setActiveTab] = useState<TabType>('inicio')
  const [sidebarSection, setSidebarSection] = useState<SidebarSection | null>(null)
  const currentUser = useAuthStore((state) => state.user)

  // Fetch business data from API using slug
  const { data: businessResponse, isLoading, error } = useBusinessBySlug(businessSlug)

  const business = businessResponse?.business

  // Determinar si el usuario es el owner del negocio
  const isOwner = currentUser?.id === business?.userId

  // Reset sidebar when changing main tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSidebarSection(null)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">{t('profile.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{t('profile.notFound.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('profile.notFound.description')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('inicio')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'inicio' && !sidebarSection
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              {t('profile.tabs.home')}
            </button>
            <button
              onClick={() => handleTabChange('acerca-de')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'acerca-de' && !sidebarSection
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              {t('profile.tabs.about')}
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area with Sidebar Layout */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Main Tab Content */}
            {!sidebarSection && (
              <>
                {activeTab === 'inicio' && (
                  <BusinessProfileContainer business={business} currentUserId={currentUser?.id} />
                )}

                {activeTab === 'acerca-de' && (
                  <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
                    <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">{t('profile.about.title')}</h2>
                    <div className="prose max-w-none dark:prose-invert">
                      <p className="text-neutral-700 dark:text-neutral-300">
                        {business.description || t('profile.about.noDescription')}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Sidebar Section Content */}
            {sidebarSection === 'fotos' && <BusinessDetailPhotos businessId={business.id} isOwner={isOwner} />}

            {sidebarSection === 'valoraciones' && (
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
                <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">{t('profile.reviews.title')}</h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {t('profile.reviews.comingSoon')}
                </p>
              </div>
            )}

            {sidebarSection === 'horarios' && (
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
            )}

            {sidebarSection === 'contacto' && (
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
                          : `${(business.address as any).street}, ${(business.address as any).city}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-800">
                <h3 className="mb-3 text-sm font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                  {t('profile.sectionsLabel')}
                </h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => setSidebarSection('fotos')}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      sidebarSection === 'fotos'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {t('profile.sections.photos')}
                  </button>

                  <button
                    onClick={() => setSidebarSection('valoraciones')}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      sidebarSection === 'valoraciones'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    {t('profile.sections.reviews')}
                  </button>

                  <button
                    onClick={() => setSidebarSection('horarios')}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      sidebarSection === 'horarios'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t('profile.sections.hours')}
                  </button>

                  <button
                    onClick={() => setSidebarSection('contacto')}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      sidebarSection === 'contacto'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {t('profile.sections.contact')}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
