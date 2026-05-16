'use client';

import { FC } from 'react';
import { useTranslations } from 'next-intl';
import {
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  ShoppingBagIcon,
} from '@/components/icons/heroicons-shim';

type SettingsSection = 'general' | 'appearance' | 'products' | 'roles' | 'stats' | 'danger';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

interface SidebarItem {
  id: SettingsSection;
  icon: typeof Cog6ToothIcon;
}

const sections: SidebarItem[] = [
  { id: 'general', icon: Cog6ToothIcon },
  { id: 'appearance', icon: PhotoIcon },
  { id: 'products', icon: ShoppingBagIcon },
  { id: 'roles', icon: UserGroupIcon },
  { id: 'stats', icon: ChartBarIcon },
  { id: 'danger', icon: ExclamationTriangleIcon },
];

export const SettingsSidebar: FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const t = useTranslations('pages.settings.sidebar');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
      <nav className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const isDanger = section.id === 'danger';

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? isDanger
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : isDanger
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  isActive
                    ? isDanger
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-blue-600 dark:text-blue-400'
                    : isDanger
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? isDanger
                        ? 'text-red-900 dark:text-red-300'
                        : 'text-blue-900 dark:text-blue-300'
                      : isDanger
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {t(`items.${section.id}.label`)}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isActive
                      ? isDanger
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {t(`items.${section.id}.description`)}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
