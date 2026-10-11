'use client'

import SocialPageLayout from '@/components/layout/SocialPageLayout'
import { usePathname } from 'next/navigation'

export default function SocialRoutesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicChat = pathname === '/chat-publico' || pathname.startsWith('/chat-publico/')
  return <SocialPageLayout allowVisitors={isPublicChat} fullscreen={isPublicChat}>{children}</SocialPageLayout>
}
