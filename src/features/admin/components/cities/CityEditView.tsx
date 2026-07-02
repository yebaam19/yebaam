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

type TabId =
  | 'metadata'
  | 'images'
  | 'admins'
  | 'features'
  | 'places'
  | 'media'
  | 'promotions'
  | 'news'
  | 'classifieds'
  | 'emprendimientos'
  | 'contact'
  | 'complaints'

interface Props {
  city: AdminCityDetail
  admins: CityAdminRow[]
  activeTab: TabId
  statusFilter: string
  page: number
}

const TAB_KEYS: { id: TabId; labelKey: string }[] = [
  { id: 'metadata', labelKey: 'tabMetadata' },
  { id: 'images', labelKey: 'tabImages' },
  { id: 'admins', labelKey: 'tabAdmins' },
  { id: 'features', labelKey: 'tabFeatures' },
  { id: 'places', labelKey: 'tabPlaces' },
  { id: 'media', labelKey: 'tabMedia' },
  { id: 'promotions', labelKey: 'tabPromotions' },
  { id: 'news', labelKey: 'tabNews' },
  { id: 'classifieds', labelKey: 'tabClassifieds' },
  { id: 'emprendimientos', labelKey: 'tabEmprendimientos' },
  { id: 'contact', labelKey: 'tabContact' },
  { id: 'complaints', labelKey: 'tabComplaints' },
]

export async function CityEditView({ city, admins, activeTab, statusFilter, page }: Props) {
  const t = await getTranslations('admin.ciudades')
  return (
    <div className="space-y-6">
      <nav
        aria-label="tabs"
        className="flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-800"
      >
        {TAB_KEYS.map((tab) => {
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
              {t(tab.labelKey)}
            </Link>
          )
        })}
      </nav>

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
