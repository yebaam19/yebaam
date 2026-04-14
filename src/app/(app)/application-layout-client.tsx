'use client'

import Aside from '@/components/aside'
import DevFeatureFlagsPanel from '@/components/dev/DevFeatureFlagsPanel'
import SocialHeader from '@/components/Header/SocialHeader'

import { CurrentUserProvider } from '@/features/auth/context/current-user.context'
import { ChatNotificationProvider } from '@/features/chat/context/chat-notification.context'
import { useNotificationSync } from '@/features/notification/hooks/useNotificationSync'
import { usePresenceSync } from '@/features/presence/hooks/usePresenceSync'
import UploadProgress from '@/features/profile/components/media/UploadProgress'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface User {
  id: string
  username: string
  displayName: string
  avatarUrl?: string | null
}

interface Props {
  children: ReactNode

  user: User
  isPlatformAdmin?: boolean
}

export function ApplicationLayoutClient({ children, user, isPlatformAdmin }: Props) {
  const pathname = usePathname()

  // Activar sincronización de notificaciones en tiempo real
  useNotificationSync()

  // Activar sincronización de presencia de usuarios en tiempo real
  usePresenceSync()

  // Si estamos en /messages, no mostrar sidebars (tiene su propio layout)
  const isMessengerRoute = pathname?.startsWith('/messages')

  if (isMessengerRoute) {
    return (
      <CurrentUserProvider user={user}>
        <ChatNotificationProvider>{children}</ChatNotificationProvider>
      </CurrentUserProvider>
    )
  }

  return (
    <CurrentUserProvider user={user}>
      <ChatNotificationProvider>
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
                © 2025 Yebaam. Todos los derechos reservados.
              </p>
            </div>
          </footer>

          {/* Chat Flotante 
          <ChatContainer />*/}

          {/* Dev: Feature Flags Panel (solo visible en desarrollo) */}
          <DevFeatureFlagsPanel />

          {/* Upload Progress Indicator (global) */}
          <UploadProgress />
        </Aside.Provider>
      </ChatNotificationProvider>
    </CurrentUserProvider>
  )
}
