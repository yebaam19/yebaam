/**
 * ServicesTabs Component
 *
 * Tabs de navegación para servicios profesionales.
 * Similar a PaginasTabs pero adaptado para servicios.
 */

'use client'

import { cn } from '@/lib/utils'

type TabType = 'my-services' | 'suggested' | 'discover'

interface ServicesTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  myServicesCount: number
  suggestedCount: number
  showMyServices?: boolean
}

export function ServicesTabs({
  activeTab,
  onTabChange,
  myServicesCount,
  suggestedCount,
  showMyServices = true,
}: ServicesTabsProps) {
  const tabs: { id: TabType; label: string; count?: number }[] = [
    ...(showMyServices ? [{ id: 'my-services' as TabType, label: 'Mis servicios', count: myServicesCount }] : []),
    { id: 'suggested' as TabType, label: 'Sugeridos', count: suggestedCount },
    { id: 'discover' as TabType, label: 'Descubrir' },
  ]

  return (
    <div className="mb-6 border-b border-neutral-200 dark:border-neutral-700">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'border-b-2 px-1 py-4 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs',
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
