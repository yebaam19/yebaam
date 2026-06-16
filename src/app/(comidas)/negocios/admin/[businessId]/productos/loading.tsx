import { ListSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function ProductosLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-neutral-100" />
      <ListSkeleton rows={6} />
    </main>
  )
}
