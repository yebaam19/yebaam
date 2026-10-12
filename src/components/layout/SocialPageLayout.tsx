'use client'

import dynamic from 'next/dynamic'
import SocialHeader from '@/components/Header/SocialHeader'
import { useSidebar } from '@/components/sidebar/hooks/useSidebar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useAuth } from '@/features/auth/context/auth-context'
import { useOptionalCurrentUser } from '@/features/auth/context/current-user.context'
import { ChatNotificationProvider } from '@/features/chat/context/chat-notification.context'
import { cn } from '@/lib/utils'
import { useIsXl } from '@/lib/hooks/useIsXl'
import { useVisibleViewport } from '@/lib/hooks/useVisibleViewport'
import { useState } from 'react'

const RightSidebar = dynamic(() => import('@/components/sidebar/RightSidebar'), { ssr: false })

interface SocialPageLayoutProps {
  children: React.ReactNode
  allowVisitors?: boolean
  fullscreen?: boolean
}

export default function SocialPageLayout({ children, allowVisitors = false, fullscreen = false }: SocialPageLayoutProps) {
  const { user } = useAuth()
  // `useAuth()` reads a localStorage-persisted Zustand store, so it is ALWAYS
  // null while server-rendering. Gating the shell on it meant `/feed` shipped
  // HTML with an empty <main> — the server paid for the timeline query and then
  // threw the result away, so nothing could paint until the JS bundle had
  // downloaded, hydrated and re-fetched. `CurrentUserProvider` is fed by the
  // server session in `(app)/application-layout.tsx`, so it is correct on both
  // sides of hydration; gate on that and let the rails fill in after mount.
  const serverUser = useOptionalCurrentUser()
  const hasSession = Boolean(serverUser ?? user)
  const { isCollapsed } = useSidebar()
  const isXl = useIsXl()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const viewportRef = useVisibleViewport(fullscreen)
  if (!hasSession && !allowVisitors) return null

  return (
    <ChatNotificationProvider>
      <div
        ref={viewportRef}
        className={cn(
          'bg-neutral-50 dark:bg-neutral-950',
          fullscreen ? 'h-dvh overflow-hidden' : 'min-h-screen',
        )}
      >
        <SocialHeader onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />

        <div className={cn('flex min-w-0', fullscreen && 'h-full min-h-0')}>
          {user && (
            <Sidebar
              user={user}
              isMobileOpen={isMobileSidebarOpen}
              onMobileClose={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Rail geometry keys off `hasSession` (known on the server) rather than
              the client-only `user`, so the reserved gutters are identical before
              and after hydration — the rails themselves are `fixed`, so they can
              fill in on mount without shifting anything. */}
          <main
            className={cn(
              'min-w-0 w-full max-w-full flex-1 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] transition-all duration-300 ease-in-out',
              hasSession && 'lg:ml-64',
              hasSession && isCollapsed && 'lg:ml-20',
              fullscreen
                ? 'flex h-full min-h-0 flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)]'
                : cn('min-h-screen', hasSession && 'xl:mr-80'),
            )}
          >
            {fullscreen ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {children}
              </div>
            ) : (
              children
            )}
          </main>

          {!fullscreen && user && isXl && (
            <aside className="hidden bg-white xl:fixed xl:top-[calc(3.5rem+env(safe-area-inset-top,0px))] xl:right-0 xl:z-30 xl:block xl:h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] xl:w-80 xl:overflow-y-auto xl:overflow-x-hidden dark:bg-neutral-900">
              <RightSidebar />
            </aside>
          )}
        </div>
      </div>
    </ChatNotificationProvider>
  )
}
