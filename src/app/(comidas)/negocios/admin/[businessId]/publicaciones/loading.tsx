import { ListSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function PublicacionesLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-52 animate-pulse rounded-xl bg-neutral-100" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-100" />
      </div>
      <ListSkeleton rows={5} />
    </main>
  )
}
