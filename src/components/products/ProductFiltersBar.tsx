'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProductFilters } from '@/interfaces/page-product.interface';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@/components/icons/heroicons-shim';

interface ProductFiltersBarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  categories?: string[];
}

export function ProductFiltersBar({
  filters,
  onFiltersChange,
  categories = []
}: ProductFiltersBarProps) {
  const t = useTranslations('businesses.products.filterBar');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, searchQuery: searchInput, page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      categoryMain: category === filters.categoryMain ? undefined : category,
      page: 1
    });
  };

  const handleStockFilter = () => {
    onFiltersChange({ ...filters, inStock: !filters.inStock, page: 1 });
  };

  const handlePromotionFilter = () => {
    onFiltersChange({ ...filters, hasPromotion: !filters.hasPromotion, page: 1 });
  };

  const clearFilters = () => {
    setSearchInput('');
    onFiltersChange({ page: 1, limit: filters.limit });
  };

  const hasActiveFilters = filters.searchQuery || filters.categoryMain ||
                          filters.inStock || filters.hasPromotion;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          {t('filters')}
        </button>
      </form>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {t('categories')}
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filters.categoryMain === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Filters */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t('quickFilters')}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleStockFilter}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.inStock
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('inStock')}
              </button>
              <button
                onClick={handlePromotionFilter}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.hasPromotion
                    ? 'bg-red-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('onPromotion')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">{t('activeFilters')}</span>
          {filters.searchQuery && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded flex items-center gap-1">
              {t('searchLabel', { query: filters.searchQuery })}
              <XMarkIcon
                aria-label={t('removeSearchAria')}
                className="w-3 h-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, searchQuery: undefined })}
              />
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:underline"
          >
            {t('clearAll')}
          </button>
        </div>
      )}
    </div>
  );
}
