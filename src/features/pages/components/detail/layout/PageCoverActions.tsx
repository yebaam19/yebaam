'use client';

import { FC, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Cog6ToothIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  HandThumbUpIcon,
  HeartIcon,
} from '@/components/icons/heroicons-shim';
import type { Page } from '../../../types/page.types';
import { useFollowPage, useUnfollowPage, usePageReaction } from '../../../hooks/usePages';
import { formatFollowersCount } from '../../../utils/pageHelpers';

interface PageCoverActionsProps {
  page: Page;
  isOwnerOrAdmin: boolean;
  unreadCount: number;
  onOpenMessenger: () => void;
}

const BTN =
  'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors';

/**
 * Los tres botones apilados arriba a la derecha de la portada (wireframe pág. 13,
 * PDF §1.3): Recomendar, Seguir, Me Gusta — cada uno con su contador.
 */
export const PageCoverActions: FC<PageCoverActionsProps> = ({
  page,
  isOwnerOrAdmin,
  unreadCount,
  onOpenMessenger,
}) => {
  const t = useTranslations('pages.detail.header');
  const followMutation = useFollowPage();
  const unfollowMutation = useUnfollowPage();
  const reactionMutation = usePageReaction();

  const isFollowing = page.isFollowing ?? false;
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  const [recommendCount, setRecommendCount] = useState(page.recommendCount ?? 0);
  const [likeCount, setLikeCount] = useState(page.likeCount ?? 0);
  const [hasRecommended, setHasRecommended] = useState(page.hasRecommended ?? false);
  const [hasLiked, setHasLiked] = useState(page.hasLiked ?? false);
  // Guarda por tipo en vez de deshabilitar el botón: el toque responde al
  // instante (optimista) y un re-tap durante el vuelo simplemente se ignora.
  const reactionInFlight = useRef<Record<'recommend' | 'like', boolean>>({
    recommend: false,
    like: false,
  });

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync(page.id);
        toast.success(t('unfollowSuccess'));
      } else {
        await followMutation.mutateAsync(page.id);
        toast.success(t('followSuccess'));
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : '') ||
        t('actionError');
      toast.error(message);
    }
  };

  const handleReaction = async (type: 'recommend' | 'like') => {
    if (reactionInFlight.current[type]) return;
    reactionInFlight.current[type] = true;

    const currentlyActive = type === 'recommend' ? hasRecommended : hasLiked;
    const setActive = type === 'recommend' ? setHasRecommended : setHasLiked;
    const setCount = type === 'recommend' ? setRecommendCount : setLikeCount;

    // Optimista: estado y contador cambian ya; si el servidor falla se revierte.
    setActive(!currentlyActive);
    setCount((c) => Math.max(0, c + (currentlyActive ? -1 : 1)));

    try {
      const result = await reactionMutation.mutateAsync({
        pageId: page.id,
        type,
        active: !currentlyActive,
      });
      // Reconciliación con la verdad del servidor (contadores denormalizados).
      setRecommendCount(result.recommendCount);
      setLikeCount(result.likeCount);
      if (type === 'recommend') setHasRecommended(result.active);
      else setHasLiked(result.active);
    } catch (error) {
      setActive(currentlyActive);
      setCount((c) => Math.max(0, c + (currentlyActive ? 1 : -1)));
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : '') ||
        t('actionError');
      toast.error(message);
    } finally {
      reactionInFlight.current[type] = false;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: page.name,
          text: page.description || t('shareText', { name: page.name }),
          url: window.location.href,
        });
      } catch {
        /* el usuario cerró la hoja de compartir */
      }
      return;
    }
    const { copyToClipboard } = await import('@/lib/clipboard');
    if (await copyToClipboard(window.location.href)) {
      toast.success(t('linkCopied'));
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col items-stretch gap-2 w-40 sm:w-44">
      <button
        type="button"
        onClick={() => handleReaction('recommend')}
        disabled={isOwnerOrAdmin}
        className={`${BTN} disabled:opacity-50 disabled:cursor-not-allowed ${
          hasRecommended
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white/90 text-gray-900 hover:bg-white dark:bg-gray-800/90 dark:text-white'
        }`}
      >
        <HandThumbUpIcon className="w-4 h-4" />
        {t('recommend')}
        <span className="text-xs opacity-75">{formatFollowersCount(recommendCount)}</span>
      </button>

      {!isOwnerOrAdmin && (
        <button
          type="button"
          onClick={handleFollowToggle}
          disabled={isFollowLoading}
          className={`${BTN} disabled:opacity-50 disabled:cursor-not-allowed ${
            isFollowing
              ? 'bg-white/90 text-gray-900 hover:bg-white dark:bg-gray-800/90 dark:text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isFollowing ? (
            <UserMinusIcon className="w-4 h-4" />
          ) : (
            <UserPlusIcon className="w-4 h-4" />
          )}
          {isFollowing ? t('following') : t('follow')}
          <span className="text-xs opacity-75">
            {formatFollowersCount(page.followerCount)}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => handleReaction('like')}
        disabled={isOwnerOrAdmin}
        className={`${BTN} disabled:opacity-50 disabled:cursor-not-allowed ${
          hasLiked
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-white/90 text-gray-900 hover:bg-white dark:bg-gray-800/90 dark:text-white'
        }`}
      >
        <HeartIcon className="w-4 h-4" />
        {t('like')}
        <span className="text-xs opacity-75">{formatFollowersCount(likeCount)}</span>
      </button>

      <div className="flex items-center gap-2">
        {isOwnerOrAdmin && (
          <Link
            href={`/paginas/${page.slug}/settings` as Route}
            title={t('settings')}
            className="flex-1 inline-flex items-center justify-center p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white dark:bg-gray-800/90 dark:text-white"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </Link>
        )}

        <button
          type="button"
          onClick={onOpenMessenger}
          title={isOwnerOrAdmin ? t('viewMessages') : t('message')}
          className="relative flex-1 inline-flex items-center justify-center p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white dark:bg-gray-800/90 dark:text-white"
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          title={t('sharePage')}
          className="flex-1 inline-flex items-center justify-center p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white dark:bg-gray-800/90 dark:text-white"
        >
          <ShareIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
