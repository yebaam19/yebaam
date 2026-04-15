'use client';

import {
  InformationCircleIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  FolderIcon,
} from '@/components/icons/heroicons-shim';

export type TabType = 'acerca' | 'fotos' | 'videos' | 'articulos' | 'archivos';

const TABS: { id: TabType; label: string; icon: typeof PhotoIcon }[] = [
  { id: 'acerca', label: 'Acerca del Club', icon: InformationCircleIcon },
  { id: 'fotos', label: 'Fotos', icon: PhotoIcon },
  { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
  { id: 'articulos', label: 'Artículos', icon: DocumentTextIcon },
  { id: 'archivos', label: 'Archivos', icon: FolderIcon },
];

interface ClubTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ClubTabs({ activeTab, onTabChange }: ClubTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <nav className="-mb-px flex gap-1 overflow-x-auto px-2" aria-label="Club sections">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
