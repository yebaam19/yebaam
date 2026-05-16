'use client';

import { FC, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { usePagesUIStore } from '../store/pagesUI.store';
import type { PageCategory } from '../types/page.types';
import { PAGE_CATEGORY_LABELS } from '../utils/pageHelpers';

interface PagesSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const PagesSearchBar: FC<PagesSearchBarProps> = ({
  onSearch,
  placeholder,
}) => {
  const t = useTranslations('pages.searchBar');
  const { searchQuery, setSearchQuery, filters, setFilters, clearFilters } = usePagesUIStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const effectivePlaceholder = placeholder ?? t('defaultPlaceholder');

  // Debounce del search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
      onSearch?.(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery, onSearch]);

  const handleClearFilters = () => {
    clearFilters();
    setLocalQuery('');
  };

  const hasActiveFilters =
    filters.category || filters.verified !== undefined || filters.location;

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch?.(localQuery);
            }
          }}
          className="block w-full pl-10 pr-20 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={effectivePlaceholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
          {(localQuery || hasActiveFilters) && (
            <button
              onClick={handleClearFilters}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={t('clearSearch')}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${
              hasActiveFilters ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
            title={t('filters')}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('categoryLabel')}
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category: e.target.value || undefined,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allCategories')}</option>
              {Object.entries(PAGE_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Verified Filter */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verified || false}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    verified: e.target.checked || undefined,
                  })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('verifiedOnly')}
              </span>
            </label>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('locationLabel')}
            </label>
            <input
              type="text"
              value={filters.location || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  location: e.target.value || undefined,
                })
              }
              placeholder={t('locationPlaceholder')}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Apply Filters Button */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('applyFilters')}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('clear')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Chips */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
              {PAGE_CATEGORY_LABELS[filters.category as PageCategory]}
              <button
                onClick={() => setFilters({ ...filters, category: undefined })}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.verified && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
              {t('verifiedChip')}
              <button
                onClick={() => setFilters({ ...filters, verified: undefined })}
                className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full">
              {filters.location}
              <button
                onClick={() => setFilters({ ...filters, location: undefined })}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
