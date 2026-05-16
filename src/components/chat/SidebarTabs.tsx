'use client';

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  EllipsisHorizontalCircleIcon,
} from '@/components/icons/heroicons-shim';

export type SidebarTab = 'inbox' | 'community';

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onMarkAllRead?: () => void;
  hasUnread?: boolean;
}

export default function SidebarTabs({
  activeTab,
  onTabChange,
  onMarkAllRead,
  hasUnread = false,
}: SidebarTabsProps) {
  const t = useTranslations('chat');
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
      <button
        type="button"
        onClick={() => onTabChange('inbox')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          activeTab === 'inbox'
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
      >
        {t('sidebar.tabInbox')}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('community')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          activeTab === 'community'
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
      >
        {t('sidebar.tabCommunities')}
      </button>

      <Menu as="div" className="relative">
        <MenuButton
          className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Más opciones"
        >
          <EllipsisHorizontalCircleIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
        </MenuButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 mt-1 w-56 origin-top-right rounded-lg bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black/5 focus:outline-none z-20 py-1">
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  disabled={!hasUnread}
                  onClick={() => onMarkAllRead?.()}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                    focus ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                  } ${
                    !hasUnread
                      ? 'opacity-50 cursor-not-allowed text-neutral-500'
                      : 'text-neutral-800 dark:text-neutral-100'
                  }`}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Marcar todo como leído
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
}
