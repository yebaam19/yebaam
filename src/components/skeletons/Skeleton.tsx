/**
 * Skeleton Components
 *
 * Componentes reutilizables para estados de carga
 */

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton base - Barra animada de carga
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-neutral-200 dark:bg-neutral-700',
        className
      )}
    />
  )
}

/**
 * Skeleton de avatar circular
 */
export function SkeletonAvatar({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(
        'rounded-full',
        className || 'h-10 w-10'
      )}
    />
  )
}

/**
 * Skeleton de texto - Línea de texto
 */
export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-4 w-full', className)} />
}

/**
 * Skeleton de título
 */
export function SkeletonTitle({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-6 w-48', className)} />
}

/**
 * Skeleton de párrafo - Múltiples líneas de texto
 */
export function SkeletonParagraph({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText
          key={i}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton de imagen rectangular
 */
export function SkeletonImage({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(
        'aspect-video w-full',
        className
      )}
    />
  )
}

/**
 * Skeleton de tarjeta
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800',
        className
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <SkeletonTitle />
      </div>
      <SkeletonParagraph lines={3} />
    </div>
  )
}

/**
 * Skeleton de botón
 */
export function SkeletonButton({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(
        'h-10 w-32 rounded-lg',
        className
      )}
    />
  )
}

/**
 * Skeleton de badge/etiqueta
 */
export function SkeletonBadge({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(
        'h-6 w-20 rounded-full',
        className
      )}
    />
  )
}

/**
 * Skeleton de input
 */
export function SkeletonInput({ className }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(
        'h-10 w-full rounded-lg',
        className
      )}
    />
  )
}
