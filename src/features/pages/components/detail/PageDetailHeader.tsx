import { FC, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  CheckBadgeIcon, 
  Cog6ToothIcon, 
  UserPlusIcon,
  UserMinusIcon,
  ShareIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
} from '@/components/icons/heroicons-shim';
import { BellIcon as BellSolidIcon } from '@/components/icons/heroicons-shim';
import type { Page } from '../../types/page.types';
import { formatFollowersCount } from '../../utils/pageHelpers';
import { useFollowPage, useUnfollowPage } from '../../hooks/usePages';
import { useAuthStore } from '@/features/auth/store/auth.store';
import PageMessengerPanel from '../messages/PageMessengerPanel';
import { usePageConversations } from '../../hooks/usePageMessages';
import { toast } from 'sonner';

interface PageDetailHeaderProps {
  page: Page;
}

export const PageDetailHeader: FC<PageDetailHeaderProps> = ({ page }) => {
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
        toast.success('Dejaste de seguir la página');
      } else {

        await followMutation.mutateAsync(page.id);
        toast.success('Ahora sigues esta página');
      }
    } catch (error: any) {
      console.error('[PageDetailHeader] Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al procesar la solicitud';
      toast.error(errorMessage);
    }
  };

  const handleNotificationToggle = () => {
    if (isFollowing) {
      setIsNotificationsEnabled(!isNotificationsEnabled);
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: page.name,
        text: page.description || `Mira esta página: ${page.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow">
      {/* Cover Image */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        {page.coverImageUrl ? (
          <Image
            src={page.coverImageUrl}
            alt={`${page.name} cover`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-linear-to-r from-blue-500 to-purple-600" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
      </div>

      {/* Page Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 sm:-mt-24 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-gray-800 bg-white dark:bg-gray-700 shadow-xl">
                {page.profileImageUrl ? (
                  <Image
                    src={page.profileImageUrl}
                    alt={page.name}
                    width={160}
                    height={160}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-500">
                    {page.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name and actions */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {page.name}
                  </h1>
                  {page.isVerified && (
                    <CheckBadgeIcon className="w-7 h-7 text-blue-500" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {formatFollowersCount(followersCount)} seguidores
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {isOwnerOrAdmin ? (
                  <>
                    {/* Admin actions */}
                    <Link
                      href={`/feed/paginas/${page.slug}/settings`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Configuración</span>
                      <span className="sm:hidden">Config</span>
                    </Link>

                    <button 
                      onClick={() => setIsMessengerOpen(true)}
                      className="relative inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Ver mensajes</span>
                      <span className="sm:hidden">Mensajes</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Visitor actions */}
                    <button
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isFollowing
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isFollowLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Procesando...</span>
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserMinusIcon className="w-5 h-5" />
                          <span>Siguiendo</span>
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-5 h-5" />
                          <span>Seguir</span>
                        </>
                      )}
                    </button>

                    {/* Notifications button (only if following) */}
                    {isFollowing && (
                      <button
                        onClick={handleNotificationToggle}
                        className={`p-2 rounded-lg transition-colors ${
                          isNotificationsEnabled
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={
                          isNotificationsEnabled
                            ? 'Notificaciones activadas'
                            : 'Activar notificaciones'
                        }
                      >
                        {isNotificationsEnabled ? (
                          <BellSolidIcon className="w-5 h-5" />
                        ) : (
                          <BellIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}

                    {/* Message button - Opens messenger to send message to page */}
                    <button 
                      onClick={() => setIsMessengerOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Mensaje</span>
                    </button>
                  </>
                )}

                {/* Share button (for everyone) */}
                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Compartir página"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>

                {/* More options */}
                {!isOwnerOrAdmin && (
                  <button
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Más opciones"
                  >
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messenger Modal - Available for both owners and visitors */}
      <PageMessengerPanel
        pageId={page.id}
        isOpen={isMessengerOpen}
        onClose={() => setIsMessengerOpen(false)}
      />
    </div>
  );
};
