'use client'

import SocialHeader from '@/components/Header/SocialHeader'
import { useSidebar } from '@/components/sidebar/hooks/useSidebar'
import RightSidebar from '@/components/sidebar/RightSidebar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useAuth } from '@/features/auth/context/auth-context'
import { ChatNotificationProvider } from '@/features/chat/context/chat-notification.context'
import { cn } from '@/lib/utils'
import { useState } from 'react'

/**
 * Cities shell — mirrors `musica/layout.tsx`. Cities is a public-accessible
 * feature route (anonymous visitors can browse), but signed-in users get the
 * full app chrome they see elsewhere: `SocialHeader` on top, `Sidebar` on the
 * left, `RightSidebar` on `xl:`. The outer `(app)/application-layout-client.tsx`
 * is configured to treat `cities/*` like `feed/*` (hasOwnChrome=true), so this
 * layout owns the chrome end-to-end with no duplication.
 *
 * The inner `cities/[slug]/layout.tsx` (max-w-6xl + CityMenu mobile FAB)
 * composes inside `<main>` and continues to add city-portal-specific padding.
 */
export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <ChatNotificationProvider>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <SocialHeader onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />

        <div className="flex min-w-0">
          {user && (
            <Sidebar
              user={user}
              isMobileOpen={isMobileSidebarOpen}
              onMobileClose={() => setIsMobileSidebarOpen(false)}
            />
          )}

          <main
            className={cn(
              'min-h-screen min-w-0 w-full max-w-full flex-1 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] transition-all duration-300 ease-in-out',
              user && 'lg:ml-64',
              user && isCollapsed && 'lg:ml-20',
              user && 'xl:mr-80',
            )}
          >
            {children}
          </main>

          {user && (
            <aside className="hidden bg-white xl:fixed xl:top-[calc(3.5rem+env(safe-area-inset-top,0px))] xl:right-0 xl:z-30 xl:block xl:h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] xl:w-80 xl:overflow-y-auto xl:overflow-x-hidden dark:bg-neutral-900">
              <RightSidebar />
            </aside>
          )}
        </div>
      </div>
    </ChatNotificationProvider>
  )
}
