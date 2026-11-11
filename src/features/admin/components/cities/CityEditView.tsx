import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import type {
  AdminCityDetail,
  CityAdminRow,
} from '@/features/admin/server/cities.server'
import { CityMetadataForm } from './editor/CityMetadataForm'
import { CityImagesTab } from './editor/CityImagesTab'
import { CityAdminsList } from './editor/CityAdminsList'
import { CityFeatureLinks } from './editor/CityFeatureLinks'
import { CityNewsModerationTab } from './editor/CityNewsModerationTab'
import { CityClassifiedsModerationTab } from './editor/CityClassifiedsModerationTab'
import { CityEmprendimientosModerationTab } from './editor/CityEmprendimientosModerationTab'
import { CityContactInboxTab } from './editor/CityContactInboxTab'
import { CityPlacesTab } from './editor/CityPlacesTab'
import { CityMultimediaTab } from './editor/CityMultimediaTab'
import { CityPromotionsTab } from './editor/CityPromotionsTab'
import { CityComplaintsTab } from './editor/CityComplaintsTab'

import { CityDirectoryTab } from './directory/CityDirectoryTab'

import { CITY_EDITOR_TABS, type CityEditorTab } from './city-editor-tabs'
import { CityCommunicationTab } from './editor/CityCommunicationTab'
import { CityCommercialTab } from './commercial/CityCommercialTab'
import { CityEventsTab } from './events/CityEventsTab'

interface Props {
  city: AdminCityDetail
  admins: CityAdminRow[]
  activeTab: CityEditorTab
  statusFilter: string
  categoryFilter: string
  page: number
}

export async function CityEditView({ city, admins, activeTab, statusFilter, page, categoryFilter }: Props) {
  const t = await getTranslations('admin.ciudades')
  return (
    <div className="space-y-6">
      <nav
        aria-label="tabs"
        className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800"
      >
        {CITY_EDITOR_TABS.map((tab) => {
          const isActive = tab.id === activeTab
          const href = (`/admin/ciudades/${city.slug}?tab=${tab.id}`) as Route
          return (
            <Link
              key={tab.id}
              href={href}
              className={
                'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200')
              }
            >
              {'label' in tab ? tab.label : t(tab.labelKey)}
            </Link>
          )
        })}
      </nav>

      {(activeTab === 'businesses' || activeTab === 'services') && <CityCommercialTab city={city} kind={activeTab} page={page} />}
      {activeTab === 'forum' && <CityCommunicationTab city={city} mode="forum" />}
      {activeTab === 'chat' && <CityCommunicationTab city={city} mode="chat" />}
      {activeTab === 'events' && <CityEventsTab city={city} page={page} />}
      {activeTab === 'directory' && <CityDirectoryTab city={city} category={categoryFilter} page={page} />}
      {activeTab === 'metadata' && <CityMetadataForm city={city} />}
      {activeTab === 'images' && <CityImagesTab city={city} />}
      {activeTab === 'admins' && <CityAdminsList city={city} admins={admins} />}
      {activeTab === 'features' && <CityFeatureLinks city={city} />}
      {activeTab === 'places' && (
        <CityPlacesTab city={city} statusFilter={statusFilter} page={page} />
      )}
      {activeTab === 'media' && <CityMultimediaTab city={city} />}
      {activeTab === 'promotions' && (
        <CityPromotionsTab city={city} statusFilter={statusFilter} page={page} />
      )}
      {activeTab === 'news' && (
        <CityNewsModerationTab city={city} statusFilter={statusFilter} page={page} />
      )}
      {activeTab === 'classifieds' && (
        <CityClassifiedsModerationTab city={city} statusFilter={statusFilter} page={page} />
      )}
      {activeTab === 'emprendimientos' && (
        <CityEmprendimientosModerationTab city={city} statusFilter={statusFilter} page={page} />
      )}
      {activeTab === 'contact' && (
        <CityContactInboxTab city={city} statusFilter={statusFilter} page={page} />
      )}
      {activeTab === 'complaints' && (
        <CityComplaintsTab city={city} statusFilter={statusFilter} page={page} />
      )}
    </div>
  )
}
