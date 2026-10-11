'use client';

import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
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
import { resolveImageRef } from '@/lib/media/urls';
import { usePageHeaderActions } from './usePageHeaderActions';
import dynamic from 'next/dynamic';

/**
 * Este header se renderiza en TODAS las visitas a /paginas/[slug]. El panel
 * de mensajería arrastra `PageMessengerChatView → usePageMessagesWebSocket →
 * socket.io-client`, así que importarlo estáticamente metía socket.io en el
 * bundle inicial de la ruta para cualquier visitante anónimo. Se carga al abrirlo.
 * `ssr: false` porque abre un WebSocket: no hay nada que prerrenderizar.
 */
const PageMessengerPanel = dynamic(() => import('../messages/PageMessengerPanel'), {
  ssr: false,
});

interface PageDetailHeaderProps {
  page: Page;
}

export const PageDetailHeader: FC<PageDetailHeaderProps> = ({ page }) => {
  const t = useTranslations('pages.detail.header');
  const {
    isOwnerOrAdmin, isNotificationsEnabled, isMessengerOpen, setIsMessengerOpen, unreadCount, isFollowing,
    followersCount, isFollowLoading, handleFollowToggle, handleNotificationToggle, handleShare
  } = usePageHeaderActions(page);

  // id-first: la DB guarda el id de Cloudflare desnudo; resolveImageRef lo
  // convierte en URL de entrega (las URLs completas legadas pasan intactas).
  const coverSrc = resolveImageRef(page.coverImageUrl, 'hero');
  const profileSrc = resolveImageRef(page.profileImageUrl, 'avatar');

  return (
    <div className="bg-white dark:bg-gray-800 shadow">
      {/* Cover Image */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={t('coverAlt', { name: page.name })}
            fill
            sizes="100vw"
            className="object-cover"
            priority
            unoptimized
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
                {profileSrc ? (
                  <Image
                    src={profileSrc}
                    alt={page.name}
                    width={160}
                    height={160}
                    className="object-cover"
                    unoptimized
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
                  {t('followersCount', { count: formatFollowersCount(followersCount) })}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {isOwnerOrAdmin ? (
                  <>
                    {/* Admin actions */}
                    <Link
                      href={`/paginas/${page.slug}/settings` as Route}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">{t('settings')}</span>
                      <span className="sm:hidden">{t('settingsShort')}</span>
                    </Link>

                    <button
                      onClick={() => setIsMessengerOpen(true)}
                      className="relative inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">{t('viewMessages')}</span>
                      <span className="sm:hidden">{t('viewMessagesShort')}</span>
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
                          <span>{t('processing')}</span>
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserMinusIcon className="w-5 h-5" />
                          <span>{t('following')}</span>
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-5 h-5" />
                          <span>{t('follow')}</span>
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
                            ? t('notificationsOn')
                            : t('notificationsEnable')
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
                      <span className="hidden sm:inline">{t('message')}</span>
                    </button>
                  </>
                )}

                {/* Share button (for everyone) */}
                <button
                  onClick={handleShare}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title={t('sharePage')}
                >
                  <ShareIcon className="w-5 h-5" />
                </button>

                {/* More options */}
                {!isOwnerOrAdmin && (
                  <button
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={t('moreOptions')}
                  >
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messenger Modal - Available for both owners and visitors.
          Montado sólo al abrirlo: el panel ya hacía `if (!isOpen) return null`,
          así que el comportamiento es idéntico y el chunk no se descarga antes. */}
      {isMessengerOpen && (
        <PageMessengerPanel
          pageId={page.id}
          isOpen
          onClose={() => setIsMessengerOpen(false)}
        />
      )}
    </div>
  );
};
