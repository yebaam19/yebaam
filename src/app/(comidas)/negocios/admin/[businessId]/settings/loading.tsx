import { FormSkeleton } from '@/features/comidas/components/admin/shared/AdminSkeleton'

export default function SettingsLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div className="h-8 w-44 animate-pulse rounded-xl bg-neutral-100" />
      <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
      <FormSkeleton />
    </main>
  )
}
