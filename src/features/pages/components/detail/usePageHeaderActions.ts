import { pageErrorMessage } from '../../utils/pageErrorMessage';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Page } from '../../types/page.types';
import { useFollowPage, useUnfollowPage } from '../../hooks/usePages';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePageConversations } from '../../hooks/usePageMessages';
import { toast } from 'sonner';

export function usePageHeaderActions(page: Page) {
  const t = useTranslations('pages.detail.header');
  // Obtener el usuario actual del store de auth
  const currentUser = useAuthStore((state) => state.user);
  
  // Verificar si el usuario actual es el owner comparando IDs directamente
  const isOwner = currentUser?.id === page.ownerId;
  const isOwnerOrAdmin = isOwner || page.userRole === 'admin';
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  
  // Get unread messages count (only for owner)
  const { data: conversationsData } = usePageConversations(
    isOwner ? page.id : undefined,
    { page: 1, limit: 50, includeArchived: false }
  );
  const unreadCount = conversationsData?.conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  ) ?? 0;
  

  
  // Mutations de TanStack Query
  const followMutation = useFollowPage();
  const unfollowMutation = useUnfollowPage();
  
  // Estado derivado del page prop (que se actualiza via invalidación de queries)
  const isFollowing = page.isFollowing || false;
  const followersCount = page.followerCount || 0;
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

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
      console.error('[PageDetailHeader] Error:', error);
      const errorMessage = pageErrorMessage(error, t('actionError'));
      toast.error(errorMessage);
    }
  };

  const handleNotificationToggle = () => {
    if (isFollowing) {
      setIsNotificationsEnabled(!isNotificationsEnabled);
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
        /* user aborted share sheet */
      }
      return;
    }
    const { copyToClipboard } = await import('@/lib/clipboard');
    if (await copyToClipboard(window.location.href)) {
      alert(t('linkCopied'));
    }
  };


  return {
    isOwnerOrAdmin,
    isNotificationsEnabled,
    isMessengerOpen,
    setIsMessengerOpen,
    unreadCount,
    isFollowing,
    followersCount,
    isFollowLoading,
    handleFollowToggle,
    handleNotificationToggle,
    handleShare
  };
}
