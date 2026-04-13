'use client'

import { MapIcon, PhotoIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'
import { CityMedia, MediaType } from '../interfaces/city.interfaces'
import { CategoriesGrid } from './CategoriesGrid'
import { CityMediaGallery } from './CityMediaGallery'

interface CityTabsProps {
  cityName: string
  citySlug: string
  photos: CityMedia[]
  videos: CityMedia[]
}

type TabId = 'explore' | 'photos' | 'videos'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
}

/**
 * Tabs de navegación para la ciudad
 */
export function CityTabs({ cityName, citySlug, photos, videos }: CityTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('explore')

  const tabs: Tab[] = [
    { id: 'explore', label: 'Explora', icon: MapIcon },
    { id: 'photos', label: 'Fotos', icon: PhotoIcon, count: photos.length },
    { id: 'videos', label: 'Videos', icon: VideoCameraIcon, count: videos.length },
  ]

  return (
    <div className="space-y-4">
      {/* Tab Headers */}
      <div className="rounded-xl bg-white p-1.5 shadow-sm dark:bg-neutral-800">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? 'bg-white/20'
                        : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'explore' && <CategoriesGrid citySlug={citySlug} />}

        {activeTab === 'photos' && (
          <CityMediaGallery
            media={photos}
            emptyMessage="Aún no hay fotos de esta ciudad. ¡Sé el primero en compartir!"
            cityName={cityName}
            mediaType={MediaType.IMAGE}
          />
        )}

        {activeTab === 'videos' && (
          <CityMediaGallery
            media={videos}
            emptyMessage="Aún no hay videos de esta ciudad. ¡Sé el primero en compartir!"
            cityName={cityName}
            mediaType={MediaType.VIDEO}
          />
        )}
      </div>
    </div>
  )
}
