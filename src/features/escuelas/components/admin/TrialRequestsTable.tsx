'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { CalendarClock, ChevronDown, Mail, Phone, User } from 'lucide-react'
import { updateTrialStatus } from '../../actions/trial.actions'
import type { TrialClassRequest, TrialStatus } from '../../types'

const STATUS_CONFIG: Record<TrialStatus, { label: string; cls: string }> = {
  REQUESTED: { label: 'Solicitada',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  CONFIRMED: { label: 'Confirmada',  cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  CANCELLED: { label: 'Cancelada',   cls: 'bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200' },
  COMPLETED: { label: 'Completada',  cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
}

function TrialCard({ trial, schoolId }: { trial: TrialClassRequest; schoolId: string }) {
  const [isPending, startTransition] = useTransition()
  const cfg = STATUS_CONFIG[trial.status]

  function changeStatus(v: TrialStatus) {
    startTransition(async () => {
      await updateTrialStatus(trial.id, v, schoolId)
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
            <p className="font-semibold leading-tight text-neutral-900">{trial.name}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              Solicitud:{' '}
              {new Date(trial.created_at).toLocaleDateString('es-CO', {
                day: 'numeric', month: 'short',
              })}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
        <CalendarClock size={13} className="shrink-0 text-neutral-400" aria-hidden="true" />
        <span>
          Fecha preferida:{' '}
          <span className="font-semibold text-neutral-900">
            {new Date(trial.preferred_date).toLocaleDateString('es-CO', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </span>
        </span>
      </div>

      {trial.message && (
        <p className="line-clamp-2 border-l-2 border-neutral-100 pl-3 text-sm italic text-neutral-500">
          {trial.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
        {trial.email && (
          <a
            href={`mailto:${trial.email}`}
            className="flex items-center gap-1.5 transition hover:text-primary-700"
          >
            <Mail size={13} aria-hidden="true" />
            {trial.email}
          </a>
        )}
        {trial.phone && (
          <a
            href={`tel:${trial.phone}`}
            className="flex items-center gap-1.5 transition hover:text-primary-700"
          >
            <Phone size={13} aria-hidden="true" />
            {trial.phone}
          </a>
        )}
      </div>

      <div className="flex justify-end border-t border-neutral-50 pt-2">
        <div className="relative">
          <select
            defaultValue={trial.status}
            disabled={isPending}
            onChange={(e) => changeStatus(e.target.value as TrialStatus)}
            className="cursor-pointer appearance-none rounded-xl border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-700 outline-none transition hover:border-neutral-300 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60"
          >
            {(Object.keys(STATUS_CONFIG) as TrialStatus[]).map((s) => (
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
  trials: TrialClassRequest[]
}

export function TrialRequestsTable({ schoolId, trials }: Props) {
  if (trials.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <CalendarClock size={24} className="text-neutral-400" />
        </div>
        <p className="text-sm font-semibold text-neutral-700">Sin solicitudes</p>
        <p className="mt-1 text-sm text-neutral-400">
          Las clases de prueba solicitadas por estudiantes aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trials.map((trial) => (
        <TrialCard key={trial.id} trial={trial} schoolId={schoolId} />
      ))}
    </div>
  )
}
