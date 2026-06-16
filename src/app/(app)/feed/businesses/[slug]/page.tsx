import { redirect } from 'next/navigation'

<<<<<<< HEAD
import { useAuthStore } from '@/features/auth/store/auth.store'
import { BusinessProfileContainer } from '@/features/businesses'
import { useBusinessBySlug } from '@/features/businesses/hooks'
import {
  BusinessSidebarNav,
  type BusinessSidebarSection,
} from '@/features/businesses/components/profile/BusinessSidebarNav'
import { BusinessSectionPanels } from '@/features/businesses/components/profile/BusinessSectionPanels'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

type TabType = 'inicio' | 'acerca-de'

export default function BusinessProfilePage() {
  const t = useTranslations('businesses')
  const params = useParams()
  const businessSlug = params.slug as string
  const [activeTab, setActiveTab] = useState<TabType>('inicio')
  const [sidebarSection, setSidebarSection] = useState<BusinessSidebarSection | null>(null)
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

            {sidebarSection && (
              <BusinessSectionPanels section={sidebarSection} business={business} isOwner={isOwner} />
            )}
          </div>

          {/* Sidebar */}
          <BusinessSidebarNav activeSection={sidebarSection} onSelect={setSidebarSection} />
        </div>
      </div>
    </div>
  )
=======
interface Props {
  params: Promise<{ slug: string }>
}

export default async function BusinessProfilePage({ params }: Props) {
  const { slug } = await params
  redirect(`/negocios/${slug}`)
>>>>>>> a6c4ca7 (feat(business): work in progress before sync)
}
