/**
 * SectionSkeleton Component
 * 
 * Loading skeleton para las secciones del perfil profesional
 */

'use client'

export function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-9 w-32 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Items Skeleton */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <div className="space-y-2">
            <div className="h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-1/4 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      ))}
    </div>
  )
}
