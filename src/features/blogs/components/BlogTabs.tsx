import { DocumentTextIcon, InformationCircleIcon, PhotoIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim'

export type TabType = 'posts' | 'fotos' | 'videos' | 'acerca-de'

interface Tab {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface BlogTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  photosCount?: number
  videosCount?: number
}

const tabs: Tab[] = [
  { id: 'acerca-de', label: 'Acerca de Mí', icon: InformationCircleIcon },
  { id: 'fotos', label: 'Fotos', icon: PhotoIcon },
  { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
  { id: 'posts', label: 'Artículos', icon: DocumentTextIcon },
]

export const BlogTabs = ({ activeTab, onTabChange, photosCount = 0, videosCount = 0 }: BlogTabsProps) => {
  const getTabLabel = (tab: Tab) => {
    if (tab.id === 'fotos' && photosCount > 0) {
      return `${tab.label} (${photosCount})`
    }
    if (tab.id === 'videos' && videosCount > 0) {
      return `${tab.label} (${videosCount})`
    }
    return tab.label
  }

  return (
    <div className="mt-6 mb-8 border-b border-neutral-200 dark:border-neutral-700">
      <nav className="-mb-px flex gap-4 overflow-x-auto sm:gap-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex shrink-0 items-center gap-1.5 border-b-2 px-1 py-3 text-xs font-medium transition-colors sm:gap-2 sm:py-4 sm:text-sm ${
                isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              } `}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              {getTabLabel(tab)}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
