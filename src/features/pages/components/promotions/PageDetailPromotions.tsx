'use client';

import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlusIcon, FunnelIcon, TagIcon } from '@/components/icons/heroicons-shim';
import { usePagePromotions, useDeletePromotion } from '../../hooks/usePagePromotions';
import { PromotionCard } from './PromotionCard';
import { CreatePromotionModal } from './CreatePromotionModal';
import { PagePromotion } from '../../interfaces/page-promotion.interface';

interface PageDetailPromotionsProps {
  pageId: string;
  pageSlug?: string;
  isOwner?: boolean;
}

type FilterType = 'all' | 'active' | 'upcoming' | 'expired';

export const PageDetailPromotions: FC<PageDetailPromotionsProps> = ({
  pageId,
  isOwner,
}) => {
  const t = useTranslations('pages');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PagePromotion | undefined>();

  const { data, isLoading } = usePagePromotions(pageId, isOwner);
  const promotions: PagePromotion[] = data ?? [];
  const deletePromotionMutation = useDeletePromotion(pageId);

  const handleDelete = (promotionId: string) => {
    if (window.confirm(t('promotions.deleteConfirm'))) {
      deletePromotionMutation.mutate(promotionId);
    }
  };

  const handleEdit = (promotion: PagePromotion) => {
    setEditingPromotion(promotion);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingPromotion(undefined);
  };

  const filteredPromotions = promotions.filter((promo) => {
    if (filter === 'active') return !promo.isExpired && !promo.isUpcoming;
    if (filter === 'upcoming') return promo.isUpcoming;
    if (filter === 'expired') return promo.isExpired;
    return true;
  });

  const activeCount = promotions.filter((p) => !p.isExpired && !p.isUpcoming).length;
  const upcomingCount = promotions.filter((p) => p.isUpcoming).length;
  const expiredCount = promotions.filter((p) => p.isExpired).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('promotions.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {promotions.length} {promotions.length === 1 ? t('promotions.promotionSingular') : t('promotions.promotionPlural')}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="font-medium">{t('promotions.newCta')}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('promotions.filters.all', { count: promotions.length })}
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'active'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('promotions.filters.active', { count: activeCount })}
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'upcoming'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {t('promotions.filters.upcoming', { count: upcomingCount })}
        </button>
        {isOwner && (
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'expired'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('promotions.filters.expired', { count: expiredCount })}
          </button>
        )}
      </div>

      {/* Promotions Grid */}
      {filteredPromotions.length === 0 ? (
        <div className="text-center py-12">
          <TagIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {filter === 'all' && t('promotions.empty.all')}
            {filter === 'active' && t('promotions.empty.active')}
            {filter === 'upcoming' && t('promotions.empty.upcoming')}
            {filter === 'expired' && t('promotions.empty.expired')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isOwner
              ? t('promotions.empty.ownerHint')
              : t('promotions.empty.visitorHint')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPromotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canManage={isOwner}
            />
          ))}
        </div>
      )}

      {/* Info Card for Users */}
      {!isOwner && activeCount > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('promotions.infoCard.title')}
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {t('promotions.infoCard.description')}
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreatePromotionModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        pageId={pageId}
        promotion={editingPromotion}
      />
    </div>
  );
};
