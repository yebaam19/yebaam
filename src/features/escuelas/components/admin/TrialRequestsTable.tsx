'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateTrialStatus } from '../../actions/trial.actions'
import type { TrialClassRequest, TrialStatus } from '../../types'

const STATUS_LABELS: Record<TrialStatus, string> = {
  REQUESTED: 'Solicitada',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
}

interface Props {
  schoolId: string
  trials: TrialClassRequest[]
}

export function TrialRequestsTable({ schoolId, trials }: Props) {
  const [isPending, startTransition] = useTransition()

  if (trials.length === 0) {
    return <p className="text-muted-foreground text-sm">Sin solicitudes de clase.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 font-medium">Nombre</th>
            <th className="pb-2 font-medium">Contacto</th>
            <th className="pb-2 font-medium">Fecha preferida</th>
            <th className="pb-2 font-medium">Estado</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {trials.map((trial) => (
            <tr key={trial.id}>
              <td className="py-2 pr-4 font-medium">{trial.name}</td>
              <td className="py-2 pr-4">
                <p>{trial.email}</p>
                <p className="text-xs text-muted-foreground">{trial.phone}</p>
              </td>
              <td className="py-2 pr-4 text-xs text-muted-foreground">
                {new Date(trial.preferred_date).toLocaleDateString('es')}
              </td>
              <td className="py-2 pr-4">
                <span className={`text-xs px-2 py-0.5 rounded-full ${trial.status === 'REQUESTED' ? 'bg-blue-100 text-blue-800' : trial.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                  {STATUS_LABELS[trial.status]}
                </span>
              </td>
              <td className="py-2">
                <select
                  defaultValue={trial.status}
                  onChange={(e) => { const v = e.target.value as TrialStatus; startTransition(async () => { await updateTrialStatus(trial.id, v); toast.success('Estado actualizado') }) }}
                  className="text-xs border border-border rounded px-2 py-1"
                >
                  {(Object.keys(STATUS_LABELS) as TrialStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
