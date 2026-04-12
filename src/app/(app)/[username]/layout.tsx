'use client'

import SocialHeader from '@/components/Header/SocialHeader'
import { useState } from 'react'

export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <SocialHeader onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />

      {/* Main Content - Sin sidebars, perfil a ancho completo */}
      <main>{children}</main>
    </div>
  )
}
