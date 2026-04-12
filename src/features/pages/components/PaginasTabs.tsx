import { FC } from 'react';

type TabType = 'my-pages' | 'followed' | 'discover';

interface PaginasTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  myPagesCount: number;
  followedPagesCount: number;
}

export const PaginasTabs: FC<PaginasTabsProps> = ({
  activeTab,
  onTabChange,
  myPagesCount,
  followedPagesCount,
}) => {
  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('my-pages')}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'my-pages'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Mis páginas
          {myPagesCount > 0 && (
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {myPagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('followed')}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'followed'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Páginas seguidas
          {followedPagesCount > 0 && (
            <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {followedPagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('discover')}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'discover'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Descubrir
        </button>
      </nav>
    </div>
  );
};
