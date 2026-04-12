/**
 * Skeleton de carga para comentarios
 * Animación de shimmer mientras cargan los datos
 */
export function CommentSkeleton() {
  return (
    <div className="p-3 animate-pulse">
      <div className="flex items-start gap-2">
        {/* Avatar skeleton */}
        <div className="shrink-0 w-8 h-8 bg-gray-300 dark:bg-neutral-700 rounded-full" />
        
        <div className="flex-1 space-y-2">
          {/* Header skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 bg-gray-300 dark:bg-neutral-700 rounded" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-neutral-800 rounded" />
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-1">
            <div className="h-3 w-full bg-gray-200 dark:bg-neutral-800 rounded" />
            <div className="h-3 w-3/4 bg-gray-200 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Lista de skeletons (para mostrar mientras carga)
 */
export function CommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}
