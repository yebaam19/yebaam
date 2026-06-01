/**
 * Professional Service Loading Page
 *
 * Skeleton de carga para la página de perfil del servicio profesional.
 * Refleja la distribución de 3 columnas del mockup (pág. 9): portada arriba,
 * riel de acciones a la izquierda, Foto de Perfil + Detalles al centro, y
 * nombre + pestañas + feed a la derecha.
 */

import { BreadcrumbSkeleton, Skeleton, SkeletonButton } from '@/components/skeletons'

export default function ServiceProfileLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-start justify-between gap-4">
        <BreadcrumbSkeleton />
        <div className="flex gap-2">
          <SkeletonButton />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Grilla de 2 filas / 3 columnas (igual que ProfileLayout) */}
      <div className="grid grid-cols-1 items-start gap-x-6 gap-y-6 py-6 xl:grid-cols-[11rem_16rem_minmax(0,1fr)]">
        {/* Portada (fila 1, cols 2-3) */}
        <div className="xl:col-start-2 xl:col-span-2 xl:row-start-1">
          <Skeleton className="h-48 w-full rounded-2xl sm:h-64 lg:h-72" />
        </div>

        {/* Riel de acciones (col 1, fila 2) */}
        <div className="flex flex-row gap-3 xl:col-start-1 xl:row-start-2 xl:flex-col">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 flex-1 rounded-2xl xl:flex-none" />
          ))}
        </div>

        {/* Columna central: Foto de Perfil + Detalles (col 2, fila 2) */}
        <div className="space-y-6 xl:col-start-2 xl:row-start-2">
          <Skeleton className="aspect-4/5 w-full rounded-2xl" />
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
            <Skeleton className="mb-4 h-6 w-24" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha: nombre + pestañas + feed (col 3, fila 2) */}
        <div className="space-y-6 xl:col-start-3 xl:row-start-2">
          {/* Nombre + Badges */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
            <Skeleton className="h-7 w-2/3" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
          {/* Tab strip */}
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-1.5 shadow-sm dark:bg-neutral-800">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-xl" />
            ))}
          </div>
          {/* Panel activo */}
          <Skeleton className="h-48 w-full rounded-2xl" />
          {/* Foto o Reel */}
          <Skeleton className="aspect-16/9 w-full rounded-2xl" />
          {/* Posts */}
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
