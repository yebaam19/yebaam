'use client'

import SocialHeader from '@/components/Header/SocialHeader'
import { useSidebar } from '@/components/sidebar/hooks/useSidebar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useAuth } from '@/features/auth/context/auth-context'
import { ChatNotificationProvider } from '@/features/chat/context/chat-notification.context'
import { cn } from '@/lib/utils'
import { useState } from 'react'

/** Authenticated Noticias uses the same full app chrome as the city portal. */
export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return <ChatNotificationProvider>
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SocialHeader onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
      <div className="flex min-w-0">
        {user && <Sidebar user={user} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />}
        <main className={cn('min-h-screen min-w-0 w-full max-w-full flex-1 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] transition-all duration-300 ease-in-out', user && 'lg:ml-64', user && isCollapsed && 'lg:ml-20')}>
          {children}
        </main>
      </div>
    </div>
  </ChatNotificationProvider>
}
