import { EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';

interface SidebarTabsProps {
  activeTab: 'inbox' | 'community';
  onTabChange: (tab: 'inbox' | 'community') => void;
}

export default function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
      <button
        onClick={() => onTabChange('inbox')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          activeTab === 'inbox'
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
      >
        Bandejas
      </button>
      <button
        onClick={() => onTabChange('community')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          activeTab === 'community'
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
      >
        Comunidades
      </button>
      <button className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <EllipsisHorizontalCircleIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
      </button>
    </div>
  );
}
