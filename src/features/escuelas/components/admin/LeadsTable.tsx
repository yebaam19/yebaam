'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateLeadStatus } from '../../actions/lead.actions'
import type { EnrollmentLead, LeadStatus } from '../../types'

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
}

interface Props {
  schoolId: string
  leads: EnrollmentLead[]
}

export function LeadsTable({ schoolId, leads }: Props) {
  const [isPending, startTransition] = useTransition()

  if (leads.length === 0) {
    return <p className="text-muted-foreground text-sm">Sin leads recibidos.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 font-medium">Nombre</th>
            <th className="pb-2 font-medium">Contacto</th>
            <th className="pb-2 font-medium">Estado</th>
            <th className="pb-2 font-medium">Fecha</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="py-2 pr-4">
                <p className="font-medium">{lead.name}</p>
                {lead.message && <p className="text-xs text-muted-foreground line-clamp-1">{lead.message}</p>}
              </td>
              <td className="py-2 pr-4">
                <p>{lead.email}</p>
                <p className="text-xs text-muted-foreground">{lead.phone}</p>
              </td>
              <td className="py-2 pr-4">
                <span className={`text-xs px-2 py-0.5 rounded-full ${lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' : lead.status === 'CONVERTED' ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                  {STATUS_LABELS[lead.status]}
                </span>
              </td>
              <td className="py-2 pr-4 text-xs text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString('es')}
              </td>
              <td className="py-2">
                <select
                  defaultValue={lead.status}
                  onChange={(e) => { const v = e.target.value as LeadStatus; startTransition(async () => { await updateLeadStatus(lead.id, v); toast.success('Estado actualizado') }) }}
                  className="text-xs border border-border rounded px-2 py-1"
                >
                  {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
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
