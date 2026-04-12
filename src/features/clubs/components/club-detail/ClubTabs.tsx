import { CalendarIcon, HomeIcon, InformationCircleIcon, UsersIcon } from '@heroicons/react/24/outline'

export type TabType = 'inicio' | 'eventos' | 'miembros' | 'acerca-de'

interface ClubTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  { id: 'inicio' as TabType, label: 'Inicio', icon: HomeIcon },
  { id: 'eventos' as TabType, label: 'Eventos', icon: CalendarIcon },
  { id: 'miembros' as TabType, label: 'Miembros', icon: UsersIcon },
  { id: 'acerca-de' as TabType, label: 'Acerca de', icon: InformationCircleIcon },
]

/**
 * Componente de navegación por tabs del club
 * Permite cambiar entre diferentes secciones del club
 */
export function ClubTabs({ activeTab, onTabChange }: ClubTabsProps) {
  return (
    <div className="mt-6 mb-8 border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              } `}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
