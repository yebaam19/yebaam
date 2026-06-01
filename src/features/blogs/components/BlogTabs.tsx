'use client'

import { ChatBubbleLeftRightIcon, DocumentTextIcon, InformationCircleIcon, MusicalNoteIcon, NewspaperIcon, PhotoIcon, QuestionMarkCircleIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

export type TabType = 'acerca-de' | 'fotos' | 'videos' | 'mi-musica' | 'articulos' | 'posts' | 'foro' | 'askme'

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
  pendingAskmeCount?: number
}

export const BlogTabs = ({ activeTab, onTabChange, photosCount = 0, videosCount = 0, pendingAskmeCount = 0 }: BlogTabsProps) => {
  const t = useTranslations('blogs.tabs')
  const tabs: Tab[] = [
    { id: 'acerca-de', label: t('about'), icon: InformationCircleIcon },
    { id: 'fotos', label: t('photos'), icon: PhotoIcon },
    { id: 'videos', label: t('videos'), icon: VideoCameraIcon },
    { id: 'mi-musica', label: t('miMusica'), icon: MusicalNoteIcon },
    { id: 'articulos', label: t('articulos'), icon: NewspaperIcon },
    { id: 'posts', label: t('posts'), icon: DocumentTextIcon },
    { id: 'foro', label: t('forum'), icon: ChatBubbleLeftRightIcon },
    { id: 'askme', label: t('askme'), icon: QuestionMarkCircleIcon },
  ]
  const getTabLabel = (tab: Tab) => {
    if (tab.id === 'fotos' && photosCount > 0) {
      return `${tab.label} (${photosCount})`
    }
    if (tab.id === 'videos' && videosCount > 0) {
      return `${tab.label} (${videosCount})`
    }
    if (tab.id === 'askme' && pendingAskmeCount > 0) {
      return `${tab.label} · ${pendingAskmeCount}`
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
