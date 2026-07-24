import Link from 'next/link'
import type { Route } from 'next'
import Image from 'next/image'
import { listBadgeGrants } from '@/features/admin/server/badges.server'
import { RevokeButton } from './RevokeButton'
import { withAdminView } from '@/lib/auth/admin-view'

interface Props {
  badgeId: string
}

export async function GrantsList({ badgeId }: Props) {
  const grants = await listBadgeGrants(badgeId, { includeRevoked: true })

  if (grants.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-neutral-500">
        Esta insignia aún no se ha asignado a ningún usuario.
      </p>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:bg-neutral-950/50">
        <tr>
          <th className="px-3 py-2">Usuario</th>
          <th className="px-3 py-2">Asignada por</th>
          <th className="px-3 py-2">Cuándo</th>
          <th className="px-3 py-2">Estado</th>
          <th className="px-3 py-2">Motivo</th>
          <th className="sr-only px-3 py-2">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {grants.map((g) => (
          <tr key={g.id} className={g.revokedAt ? 'opacity-50' : ''}>
            <td className="px-3 py-2">
              {g.username ? (
                <Link
                  href={withAdminView(`/${g.username}`) as Route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:underline"
                >
                  {g.avatarUrl ? (
                    <Image
                      src={g.avatarUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="size-6 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="size-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  )}
                  <span>
                    <span className="block">{g.displayName || g.username}</span>
                    <span className="block text-[10px] text-neutral-500">@{g.username}</span>
                  </span>
                </Link>
              ) : (
                <span className="text-neutral-500">{g.userId.slice(0, 8)}…</span>
              )}
            </td>
            <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
              {g.awardedByUsername ? `@${g.awardedByUsername}` : '—'}
            </td>
            <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
              {new Date(g.awardedAt).toLocaleString('es-ES')}
            </td>
            <td className="px-3 py-2 text-xs">
              {g.revokedAt ? (
                <span className="text-red-600 dark:text-red-400">Revocada</span>
              ) : g.acceptanceStatus === 'accepted' ? (
                <span className="text-emerald-600 dark:text-emerald-400">Aceptada</span>
              ) : g.acceptanceStatus === 'pending' ? (
                <span className="text-amber-600 dark:text-amber-400">Pendiente</span>
              ) : (
                <span className="text-neutral-500">Rechazada</span>
              )}
            </td>
            <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
              {g.reason ?? g.revokeReason ?? '—'}
            </td>
            <td className="px-3 py-2 text-right">
              {!g.revokedAt && <RevokeButton grantId={g.id} />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
