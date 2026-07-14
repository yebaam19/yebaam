'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { toggleSchoolStatus } from '../../actions/school.actions'

interface Props {
  schoolId: string
  isActive: boolean
}

export function SchoolStatusToggle({ schoolId, isActive }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleSchoolStatus(schoolId, !isActive)
        toast.success(isActive ? 'Escuela desactivada — ya no aparece en el directorio.' : 'Escuela activada — ya es visible en el directorio.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-neutral-900">
          Estado de la escuela
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {isActive
            ? 'Activa — aparece en el directorio público y los usuarios pueden encontrarla.'
            : 'Inactiva — no aparece en el directorio. Puedes seguir editando el perfil.'}
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        role="switch"
        aria-checked={isActive}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait ${
          isActive ? 'bg-primary-700' : 'bg-neutral-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">{isActive ? 'Desactivar escuela' : 'Activar escuela'}</span>
      </button>
    </div>
  )
}
