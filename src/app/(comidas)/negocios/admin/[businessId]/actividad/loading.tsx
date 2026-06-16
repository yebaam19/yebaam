import { TimelineSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function ActividadLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="h-8 w-36 animate-pulse rounded-xl bg-neutral-100" />
      <TimelineSkeleton items={8} />
    </main>
  )
}
