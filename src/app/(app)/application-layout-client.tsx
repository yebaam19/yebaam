'use client'

import SocialHeader from '@/components/Header/SocialHeader'
import Aside from '@/components/aside'
import ChatBubbleTray from '@/components/chat/ChatBubbleTray'
import AnonymousChatRoot from '@/features/anonymous-chat/components/AnonymousChatRoot'

import { CurrentUserProvider } from '@/features/auth/context/current-user.context'
import { CallProvider } from '@/features/chat/calls/CallProvider'
import { ChatNotificationProvider } from '@/features/chat/context/chat-notification.context'
import { useNotificationSync } from '@/features/notification/hooks/useNotificationSync'
import { usePresenceSync } from '@/features/presence/hooks/usePresenceSync'
import UploadProgress from '@/features/profile/components/media/UploadProgress'

import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { useVisibleViewport } from '@/lib/hooks/useVisibleViewport'

interface User {
  id: string
  username: string
  displayName: string
  avatarUrl?: string | null
  email?: string
}

interface Props {
  children: ReactNode

  user: User
  isPlatformAdmin?: boolean
}

export function ApplicationLayoutClient({ children, user, isPlatformAdmin }: Props) {
  const pathname = usePathname()
  const t = useTranslations('header')

  // Activar sincronización de notificaciones en tiempo real
  useNotificationSync()

  // Activar sincronización de presencia de usuarios en tiempo real
  usePresenceSync()

  // Si estamos en /messages, no mostrar sidebars (tiene su propio layout)
  const isMessengerRoute = pathname?.startsWith('/messages')
  const isChatShellRoute = pathname === '/chat' || pathname?.startsWith('/chat/')
  const chatViewportRef = useVisibleViewport(Boolean(isChatShellRoute))

  // Messenger-style /chat: sin footer ni padding estrecho; el contenido arma dos columnas
  if (isChatShellRoute) {
    return (
      <CurrentUserProvider user={user}>
        <ChatNotificationProvider>
          <CallProvider>
            <Aside.Provider>
              <SocialHeader isPlatformAdmin={isPlatformAdmin} />
              <main ref={chatViewportRef} className="flex h-dvh min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)] pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
                <div className="mx-auto min-h-0 w-full max-w-none flex-1">{children}</div>
              </main>
              <AnonymousChatRoot />
              <UploadProgress />
            </Aside.Provider>
          </CallProvider>
        </ChatNotificationProvider>
      </CurrentUserProvider>
    )
  }

  if (isMessengerRoute) {
    return (
      <CurrentUserProvider user={user}>
        <ChatNotificationProvider>
          <CallProvider>
            {children}
            <AnonymousChatRoot />
          </CallProvider>
        </ChatNotificationProvider>
      </CurrentUserProvider>
    )
  }

  // Rutas que renderizan su propia chrome completa (Header + Sidebar):
  // /feed/*, /cities/* y /[username]. Para estas, omitimos el wrapper externo
  // (header + main + padding) para evitar duplicación de header y padding-top
  // que rompía la responsividad.
  const RESERVED_TOP_LEVEL = new Set([
    'messages',
    'notifications',
    'search',
    'grupos',
    'foro',
    'stories',
    'chat',
    'watch',
    'login',
    'signup',
    'forgot-password',
    'reset-password',
    'verify-email',
    'api',
  ])
  const segments = pathname?.split('/').filter(Boolean) ?? []
  const firstSegment = segments[0]
  const hasOwnChrome =
    ['profiles', 'friends', 'clubs', 'blogs', 'familias', 'professional-profile', 'chat-publico'].includes(firstSegment) ||
    firstSegment === 'feed' ||
    firstSegment === 'cities' ||
    firstSegment === 'comunidades' ||
    firstSegment === 'insignias' ||
    firstSegment === 'noticias' ||
    firstSegment === 'professional-services' ||
    firstSegment === 'paginas' ||
    (segments.length === 1 && !!firstSegment && !RESERVED_TOP_LEVEL.has(firstSegment))

  if (hasOwnChrome) {
    return (
      <CurrentUserProvider user={user}>
        <ChatNotificationProvider>
          <CallProvider>
            <Aside.Provider>
              {children}
              <ChatBubbleTray />
              <AnonymousChatRoot />
              <UploadProgress />
            </Aside.Provider>
          </CallProvider>
        </ChatNotificationProvider>
      </CurrentUserProvider>
    )
  }

  return (
    <CurrentUserProvider user={user}>
      <ChatNotificationProvider>
        <CallProvider>
          <Aside.Provider>
            {/* Banner de ambiente (solo en dev/staging) */}

            {/* Header de navegación social */}
            <SocialHeader isPlatformAdmin={isPlatformAdmin} />

            <main className="min-w-0 w-full max-w-full pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-8">
              <div className="mx-auto w-full max-w-[100vw] px-4 sm:px-6">{children}</div>
            </main>

            {/* Footer */}
            <footer className="border-t border-neutral-200 bg-white py-8 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="container mx-auto px-4">
                <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                  {t('copyrightFooter', { year: new Date().getFullYear() })}
                </p>
              </div>
            </footer>

            {/* Chat bubbles (global overlay) */}
            <ChatBubbleTray />

            {/* Anonymous (ephemeral) chat overlay: invite prompt + bubbles */}
            <AnonymousChatRoot />

            {/* Upload Progress Indicator (global) */}
            <UploadProgress />
          </Aside.Provider>
        </CallProvider>
      </ChatNotificationProvider>
    </CurrentUserProvider>
  )
}
