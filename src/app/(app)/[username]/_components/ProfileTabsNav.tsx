'use client';

import { DocumentTextIcon, HomeIcon, InformationCircleIcon, PhotoIcon, UsersIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim';
import { PawIcon } from '@/components/icons/PawIcon';
import { useTranslations } from 'next-intl';

export type TabType =
  | 'publicaciones'
  | 'acerca-de'
  | 'amigos'
  | 'familias'
  | 'mascotas'
  | 'fotos'
  | 'videos';

const TABS: ReadonlyArray<{ id: TabType; labelKey: string; icon: typeof DocumentTextIcon }> = [
  { id: 'publicaciones', labelKey: 'publicaciones', icon: DocumentTextIcon },
  { id: 'acerca-de', labelKey: 'acercaDe', icon: InformationCircleIcon },
  { id: 'amigos', labelKey: 'amigos', icon: UsersIcon },
  { id: 'familias', labelKey: 'familias', icon: HomeIcon },
  { id: 'mascotas', labelKey: 'mascotas', icon: PawIcon as typeof DocumentTextIcon },
  { id: 'fotos', labelKey: 'fotos', icon: PhotoIcon },
  { id: 'videos', labelKey: 'videos', icon: VideoCameraIcon },
];

const TAB_IDS = new Set<TabType>(TABS.map((t) => t.id));

export function isValidTab(value: string | null): value is TabType {
  return value !== null && TAB_IDS.has(value as TabType);
}

interface ProfileTabsNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function ProfileTabsNav({ activeTab, onTabChange }: ProfileTabsNavProps) {
  const t = useTranslations('profile');

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-10 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto max-w-5xl min-w-0 px-3 sm:px-6 lg:px-8">
        <nav className="-mb-px flex gap-2 overflow-x-auto pb-px sm:gap-4 md:justify-between">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group inline-flex shrink-0 items-center gap-1.5 border-b-2 px-1.5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors hover:cursor-pointer sm:gap-2 sm:px-2 ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500'}`}
                />
                <span>{t(`tabs.${tab.labelKey}`)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
