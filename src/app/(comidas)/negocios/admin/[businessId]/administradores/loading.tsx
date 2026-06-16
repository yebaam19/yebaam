import { ListSkeleton, FormSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function AdministradoresLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-neutral-100" />
      <ListSkeleton rows={3} />
      <FormSkeleton />
    </main>
  )
}
