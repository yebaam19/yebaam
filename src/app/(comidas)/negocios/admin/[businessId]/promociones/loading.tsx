import { ListSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function PromocionesLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="h-8 w-44 animate-pulse rounded-xl bg-neutral-100" />
      <ListSkeleton rows={4} />
    </main>
  )
}
