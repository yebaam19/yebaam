import { listBadgeAudit } from '@/features/admin/server/badges.server'

const ACTION_LABEL: Record<string, string> = {
  create: 'Creó',
  update: 'Actualizó',
  soft_delete: 'Eliminó',
  restore: 'Restauró',
  grant: 'Asignó',
  revoke: 'Revocó',
  request_approve: 'Aprobó solicitud',
  request_reject: 'Rechazó solicitud',
}

export async function AuditLogTable({ badgeId }: { badgeId: string }) {
  const rows = await listBadgeAudit({ badgeId, pageSize: 50 })

  if (rows.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-neutral-500">Sin actividad registrada.</p>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:bg-neutral-950/50">
        <tr>
          <th className="px-3 py-2">Cuándo</th>
          <th className="px-3 py-2">Acción</th>
          <th className="px-3 py-2">Por</th>
          <th className="px-3 py-2">Usuario afectado</th>
          <th className="px-3 py-2">Motivo</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
              {new Date(r.createdAt).toLocaleString('es-ES')}
            </td>
            <td className="px-3 py-2 text-xs font-medium">{ACTION_LABEL[r.action] ?? r.action}</td>
            <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
              {r.actorUsername ? `@${r.actorUsername}` : '—'}
            </td>
            <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
              {r.username ? `@${r.username}` : '—'}
            </td>
            <td className="px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400">
              {r.reason ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
