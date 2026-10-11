'use client'

import SocialPageLayout from '@/components/layout/SocialPageLayout'
import { usePathname } from 'next/navigation'

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullscreen = pathname === '/chat-publico' || pathname?.startsWith('/chat-publico/')
  return <SocialPageLayout allowVisitors={fullscreen} fullscreen={fullscreen}>{children}</SocialPageLayout>
}
