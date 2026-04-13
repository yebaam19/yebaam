import { FC } from 'react';
import {
  HomeIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  PlayIcon,
} from '@/components/icons/heroicons-shim';

type TabType =
  | 'inicio'
  | 'publicaciones'
  | 'reels'
  | 'acerca-de';

interface Tab {
  id: TabType;
  label: string;
  icon: typeof HomeIcon;
}

interface PageDetailTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: Tab[] = [
  { id: 'inicio', label: 'Inicio', icon: HomeIcon },
  { id: 'publicaciones', label: 'Publicaciones', icon: DocumentTextIcon },
  { id: 'reels', label: 'Reels', icon: PlayIcon },
  { id: 'acerca-de', label: 'Acerca de', icon: InformationCircleIcon },
];

export const PageDetailTabs: FC<PageDetailTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
