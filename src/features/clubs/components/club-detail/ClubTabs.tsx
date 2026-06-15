'use client';

import { useTranslations } from 'next-intl';
import {
  InformationCircleIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  FolderIcon,
  Squares2X2Icon,
} from '@/components/icons/heroicons-shim';

export type TabType =
  | 'acerca'
  | 'publicaciones'
  | 'fotos'
  | 'videos'
  | 'articulos'
  | 'archivos';

type TabKey = 'about' | 'photos' | 'videos' | 'articles' | 'files';

// `labelKey` resolves via next-intl; `label` is a hardcoded fallback for tabs
// without a translation entry yet (Publicaciones).
const TABS: {
  id: TabType;
  labelKey?: TabKey;
  label?: string;
  icon: typeof PhotoIcon;
}[] = [
  { id: 'acerca', labelKey: 'about', icon: InformationCircleIcon },
  { id: 'publicaciones', label: 'Publicaciones', icon: Squares2X2Icon },
  { id: 'fotos', labelKey: 'photos', icon: PhotoIcon },
  { id: 'videos', labelKey: 'videos', icon: VideoCameraIcon },
  { id: 'articulos', labelKey: 'articles', icon: DocumentTextIcon },
  { id: 'archivos', labelKey: 'files', icon: FolderIcon },
];

interface ClubTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ClubTabs({ activeTab, onTabChange }: ClubTabsProps) {
  const t = useTranslations('clubes');
  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <nav
        role="tablist"
        className="-mb-px flex gap-1 overflow-x-auto px-2"
        aria-label={t('detail.tabs.ariaLabel')}
      >
        {TABS.map(({ id, labelKey, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {labelKey ? t(`detail.tabs.${labelKey}`) : label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
