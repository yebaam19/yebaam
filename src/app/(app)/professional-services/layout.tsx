'use client'

import SocialHeader from '@/components/Header/SocialHeader'
import { useSidebar } from '@/components/sidebar/hooks/useSidebar'
import RightSidebar from '@/components/sidebar/RightSidebar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useAuth } from '@/features/auth/context/auth-context'
import { ChatNotificationProvider } from '@/features/chat/context/chat-notification.context'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

/**
 * Professional Services shell — mirrors `cities/layout.tsx`. The module lives
 * at the top level (`/professional-services`, NOT `/feed/...`) and is public by
 * design (the PDF discovery flow starts in the public city portal directory),
 * but signed-in users get the full app chrome: `SocialHeader` on top, `Sidebar`
 * on the left, `RightSidebar` on `xl:`. The outer
 * `(app)/application-layout-client.tsx` treats `professional-services/*` like
 * `cities/*` (hasOwnChrome=true), so this layout owns the chrome end-to-end
 * with no duplication.
 */
export default function ProfessionalServicesLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const pathname = usePathname()

  // La página de detalle (`/professional-services/<slug>`) usa una distribución
  // propia de 3 columnas (mockup pág. 9). Ahí ocultamos el `RightSidebar` para
  // que el perfil reclame todo el ancho. El listado (`/professional-services`)
  // lo conserva.
  const isDetail = /^\/professional-services\/[^/]+\/?$/.test(pathname ?? '')
  const showRightSidebar = Boolean(user) && !isDetail

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
              showRightSidebar && 'xl:mr-80',
            )}
          >
            {children}
          </main>

          {showRightSidebar && (
            <aside className="hidden bg-white xl:fixed xl:top-[calc(3.5rem+env(safe-area-inset-top,0px))] xl:right-0 xl:z-30 xl:block xl:h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] xl:w-80 xl:overflow-y-auto xl:overflow-x-hidden dark:bg-neutral-900">
              <RightSidebar />
            </aside>
          )}
        </div>
      </div>
    </ChatNotificationProvider>
  )
}
