import SocialPageLayout from '@/components/layout/SocialPageLayout'

export default function CommunitiesLayout({ children }: { children: React.ReactNode }) {
  return <SocialPageLayout allowVisitors>{children}</SocialPageLayout>
}
