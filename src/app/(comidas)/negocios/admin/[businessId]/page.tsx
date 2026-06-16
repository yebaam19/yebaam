import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById } from '@/features/comidas/server/business.server'
import { DashboardStats, fetchBusinessStats } from '@/features/comidas/components/admin/DashboardStats'
import { DashboardEmptyState } from '@/features/comidas/components/admin/DashboardEmptyState'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminDashboardPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, stats] = await Promise.all([
    getBusinessById(businessId),
    fetchBusinessStats(businessId),
  ])
  if (!business) notFound()

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard — {business.name}</h1>

      {stats.posts === 0 && (
        <DashboardEmptyState
          businessId={businessId}
          businessName={business.name}
          businessSlug={business.slug}
          followersCount={stats.follows}
        />
      )}

      <DashboardStats businessId={businessId} />
    </main>
  )
}
