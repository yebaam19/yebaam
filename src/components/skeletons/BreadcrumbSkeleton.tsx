/**
 * Breadcrumb Skeleton
 *
 * Skeleton para breadcrumbs/migas de pan
 */

import { Skeleton } from './Skeleton'

export function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}
