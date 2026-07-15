'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Mail, Phone, User } from 'lucide-react'
import { updateLeadStatus } from '../../actions/lead.actions'
import type { EnrollmentLead, LeadStatus } from '../../types'

const STATUS_CONFIG: Record<LeadStatus, { label: string; cls: string }> = {
  NEW:       { label: 'Nuevo',      cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  CONTACTED: { label: 'Contactado', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  CONVERTED: { label: 'Convertido', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  LOST:      { label: 'Perdido',    cls: 'bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200' },
}

function LeadCard({ lead, schoolId }: { lead: EnrollmentLead; schoolId: string }) {
  const [isPending, startTransition] = useTransition()
  const cfg = STATUS_CONFIG[lead.status]

  function changeStatus(v: LeadStatus) {
    startTransition(async () => {
      await updateLeadStatus(lead.id, v, schoolId)
      toast.success('Estado actualizado')
    })
  }

  return (
    <article className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
            <User size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold leading-tight text-neutral-900">{lead.name}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {new Date(lead.created_at).toLocaleDateString('es-CO', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
          {cfg.label}
        </span>
      </div>

      {lead.message && (
        <p className="line-clamp-2 border-l-2 border-neutral-100 pl-3 text-sm italic text-neutral-500">
          {lead.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-1.5 transition hover:text-primary-700"
          >
            <Mail size={13} aria-hidden="true" />
            {lead.email}
          </a>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 transition hover:text-primary-700"
          >
            <Phone size={13} aria-hidden="true" />
            {lead.phone}
          </a>
        )}
      </div>

      <div className="flex justify-end border-t border-neutral-50 pt-2">
        <div className="relative">
          <select
            defaultValue={lead.status}
            disabled={isPending}
            onChange={(e) => changeStatus(e.target.value as LeadStatus)}
            className="cursor-pointer appearance-none rounded-xl border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-700 outline-none transition hover:border-neutral-300 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60"
          >
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
        </div>
      </div>
    </article>
  )
}

interface Props {
  schoolId: string
  leads: EnrollmentLead[]
}

export function LeadsTable({ schoolId, leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <Mail size={24} className="text-neutral-400" />
        </div>
        <p className="text-sm font-semibold text-neutral-700">Sin leads aún</p>
        <p className="mt-1 text-sm text-neutral-400">
          Los formularios de contacto de tu perfil aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} schoolId={schoolId} />
      ))}
    </div>
  )
}
