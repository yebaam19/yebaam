import Link from 'next/link'
import type { Route } from 'next'
import Image from 'next/image'
import type { AdminBadgeRow } from '@/features/admin/types/badges.types'

interface Props {
  items: AdminBadgeRow[]
  page: number
  totalPages: number
  buildHref: (page: number) => Route
}

function BadgeIcon({ row }: { row: AdminBadgeRow }) {
  if (row.iconUrl) {
    return (
      <Image
        src={row.iconUrl}
        alt={row.name}
        width={32}
        height={32}
        className="size-8 rounded-md object-contain"
        unoptimized
      />
    )
  }
  // Fallback chip with the first letter.
  return (
    <span className="flex size-8 items-center justify-center rounded-md bg-neutral-200 text-xs font-semibold uppercase text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
      {row.name.slice(0, 1)}
    </span>
  )
}

export function BadgesAdminTable({ items, page, totalPages, buildHref }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:bg-neutral-950/50">
          <tr>
            <th className="px-3 py-2">Insignia</th>
            <th className="px-3 py-2">Slot</th>
            <th className="px-3 py-2">Categoría</th>
            <th className="px-3 py-2">Visibilidad</th>
            <th className="px-3 py-2">Asignaciones</th>
            <th className="px-3 py-2">Solicitudes</th>
            <th className="px-3 py-2">Estado</th>
            <th className="sr-only px-3 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((b) => (
            <tr key={b.id} className={b.deletedAt ? 'opacity-60' : ''}>
              <td className="px-3 py-2">
                <Link
                  href={`/admin/badges/${b.slug}` as Route}
                  className="flex items-center gap-3 hover:underline"
                >
                  <BadgeIcon row={b} />
                  <span>
                    <span className="block font-semibold text-neutral-900 dark:text-neutral-100">
                      {b.name}
                    </span>
                    <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                      /{b.slug}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-2">
                <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] dark:bg-neutral-800">
                  {b.slot === 'insignia' ? 'Insignia' : 'Badge'}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                {b.category}
                {b.tier ? ` · ${b.tier}` : ''}
              </td>
              <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
                {b.visibility === 'public' ? 'Pública' : 'Privada'}
              </td>
              <td className="px-3 py-2 tabular-nums">{b.grantCount}</td>
              <td className="px-3 py-2 tabular-nums">
                {b.pendingRequestCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    {b.pendingRequestCount}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-3 py-2 text-xs">
                {b.deletedAt ? (
                  <span className="text-red-600 dark:text-red-400">Eliminada</span>
                ) : b.isSystem ? (
                  <span className="text-blue-600 dark:text-blue-400">Sistema</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">Activa</span>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/admin/badges/${b.slug}` as Route}
                  className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-8 text-center text-sm text-neutral-500">
                No hay insignias para los filtros seleccionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <nav className="flex items-center justify-between border-t border-neutral-200 px-3 py-2 text-xs dark:border-neutral-800">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildHref(page - 1)}
                className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref(page + 1)}
                className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700"
              >
                Siguiente
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
