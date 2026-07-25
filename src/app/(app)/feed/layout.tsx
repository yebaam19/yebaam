'use client'

import SocialHeader from '@/components/Header/SocialHeader'
import { useSidebar } from '@/components/sidebar/hooks/useSidebar'
import RightSidebar from '@/components/sidebar/RightSidebar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useAuth } from '@/features/auth/context/auth-context'
import { useOptionalCurrentUser } from '@/features/auth/context/current-user.context'
import { ChatNotificationProvider } from '@/features/chat/context/chat-notification.context'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function FeedLayout({ children }: { children: React.ReactNode }) {
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Public chat needs full viewport width + height (no right rail, no scroll
  // container). It's also reachable to guests, so don't gate it on the session.
  const isChatFullscreen = pathname?.startsWith('/feed/chat-publico') ?? false

  if (!hasSession && !isChatFullscreen) {
    return null
  }

  return (
    <ChatNotificationProvider>
      <div
        className={cn(
          'bg-neutral-50 dark:bg-neutral-950',
          isChatFullscreen ? 'h-screen overflow-hidden' : 'min-h-screen',
        )}
      >
        <SocialHeader onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />

        <div className="flex min-w-0">
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
              isChatFullscreen
                ? 'h-screen overflow-hidden'
                : cn('min-h-screen', hasSession && 'xl:mr-80'),
            )}
          >
            {isChatFullscreen ? (
              <div className="h-[calc(100vh-3.5rem-env(safe-area-inset-top,0px))]">
                {children}
              </div>
            ) : (
              children
            )}
          </main>

          {!isChatFullscreen && user && (
            <aside className="hidden bg-white xl:fixed xl:top-[calc(3.5rem+env(safe-area-inset-top,0px))] xl:right-0 xl:z-30 xl:block xl:h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] xl:w-80 xl:overflow-y-auto xl:overflow-x-hidden dark:bg-neutral-900">
              <RightSidebar />
            </aside>
          )}
        </div>
      </div>
    </ChatNotificationProvider>
  )
}
