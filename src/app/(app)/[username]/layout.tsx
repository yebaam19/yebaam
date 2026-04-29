'use client'

import SocialHeader from '@/components/Header/SocialHeader'
import { useSidebar } from '@/components/sidebar/hooks/useSidebar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useAuth } from '@/features/auth/context/auth-context'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { isCollapsed } = useSidebar()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <SocialHeader onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />

      {/* Main Content Area */}
      <div className="flex min-w-0 max-w-full">
        {/* Left Sidebar - Menu */}
        {user && (
          <Sidebar
            user={user}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            'min-h-screen min-w-0 w-full max-w-full flex-1 overflow-x-hidden pt-[calc(3.5rem+env(safe-area-inset-top,0px))] transition-all duration-300 ease-in-out',
            user && 'lg:ml-64',
            user && isCollapsed && 'lg:ml-20'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
