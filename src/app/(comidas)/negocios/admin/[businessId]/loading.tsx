import { StatsSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-neutral-100" />
      <StatsSkeleton />
    </main>
  )
}
