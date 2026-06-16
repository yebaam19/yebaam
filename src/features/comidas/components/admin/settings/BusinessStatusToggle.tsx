'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateBusinessStatus } from '../../../actions/business.actions'

interface Props {
  businessId: string
  isActive: boolean
}

export function BusinessStatusToggle({ businessId, isActive }: Props) {
  const [isPending, start] = useTransition()

  function handleToggle() {
    start(async () => {
      try {
        await updateBusinessStatus(businessId, !isActive)
        toast.success(isActive ? 'Negocio desactivado' : 'Negocio activado')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
      }
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      disabled={isPending}
      onClick={handleToggle}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-wait',
        isActive ? 'bg-primary-600' : 'bg-neutral-300',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0',
          'transition duration-200 ease-in-out',
          isActive ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}
