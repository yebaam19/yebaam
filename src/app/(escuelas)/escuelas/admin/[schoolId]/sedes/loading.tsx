import { FormSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-neutral-100" />
      <FormSkeleton />
    </main>
  )
}
