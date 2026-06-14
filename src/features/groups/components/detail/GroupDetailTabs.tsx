'use client';

import type { ComponentType, SVGProps } from 'react';
import { useTranslations } from 'next-intl';
import {
  DocumentTextIcon,
  UsersIcon,
  InformationCircleIcon,
} from '@/components/icons/heroicons-shim';

export type GroupDetailTab = 'posts' | 'members' | 'about';

const TABS: ReadonlyArray<{
  id: GroupDetailTab;
  labelKey: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { id: 'posts', labelKey: 'detail.tabs.posts', Icon: DocumentTextIcon },
  { id: 'members', labelKey: 'detail.tabs.members', Icon: UsersIcon },
  { id: 'about', labelKey: 'detail.tabs.about', Icon: InformationCircleIcon },
];

interface Props {
  activeTab: GroupDetailTab;
  onChange: (tab: GroupDetailTab) => void;
}

/** The posts / members / about tab bar nested in the group detail card. */
export function GroupDetailTabs({ activeTab, onChange }: Props) {
  const t = useTranslations('grupos');
  return (
    <div className="-mx-3 -mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200 px-3 sm:mx-0 sm:px-0 dark:border-neutral-800">
      {TABS.map(({ id, labelKey, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`px-4 py-3 font-medium transition-colors relative ${
              active
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </div>
            {active && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
