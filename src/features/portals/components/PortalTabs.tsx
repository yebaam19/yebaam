/**
 * PortalTabs Component
 *
 * Tabs de navegación del portal (Explora, Galería, Videos)
 */

'use client'

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { MapIcon, PhotoIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim'
import { PortalSection } from '../interfaces'
import { PortalSectionsGrid } from './PortalSectionsGrid'

interface PortalTabsProps {
  sections: PortalSection[]
}

export function PortalTabs({ sections }: PortalTabsProps) {
  const tabs = [
    { id: 'explore', label: 'Explora', icon: 'MapIcon' as const },
    { id: 'photos', label: 'Galería', icon: 'PhotoIcon' as const },
    { id: 'videos', label: 'Videos', icon: 'VideoCameraIcon' as const },
  ]

  const iconMap = {
    MapIcon,
    PhotoIcon,
    VideoCameraIcon,
  }

  return (
    <div className="mx-auto w-full space-y-6">
      <TabGroup>
        <div className="no-scrollbar overflow-x-auto">
          <TabList className="flex gap-2">
            {tabs.map((tab) => {
              const TabIcon = iconMap[tab.icon]
              return (
                <Tab
                  key={tab.id}
                  className={({ selected }) =>
                    `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
                      selected
                        ? 'bg-secondary-500 font-bold text-white'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`
                  }
                >
                  <TabIcon className="size-5" />
                  {tab.label}
                </Tab>
              )
            })}
          </TabList>
        </div>

        <TabPanels className="mt-4">
          {/* Explore Tab */}
          <TabPanel>
            <PortalSectionsGrid sections={sections} />
          </TabPanel>

          {/* Photos Tab */}
          <TabPanel>
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-amber-500/50 bg-linear-to-br from-red-500/5 to-amber-500/5">
              <div className="flex flex-col items-center text-center">
                <PhotoIcon className="mb-4 size-16 text-amber-500" />
                <h3 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Galería de Fotos</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Próximamente: Imágenes icónicas de la salsa caleña
                </p>
              </div>
            </div>
          </TabPanel>

          {/* Videos Tab */}
          <TabPanel>
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-green-500/50 bg-linear-to-br from-green-500/5 to-emerald-500/5">
              <div className="flex flex-col items-center text-center">
                <VideoCameraIcon className="mb-4 size-16 text-green-500" />
                <h3 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Videos de Salsa</h3>
                <p className="text-neutral-600 dark:text-neutral-400">Próximamente: Presentaciones y documentales</p>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
