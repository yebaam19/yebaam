import { CardGridSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function MediaLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-neutral-100" />
      <CardGridSkeleton cards={8} />
    </main>
  )
}
