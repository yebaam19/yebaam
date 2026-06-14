'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckBadgeIcon } from '@/components/icons/heroicons-shim'
import { setWorkVerificationAction } from '@/features/admin/actions/work-verification.actions'

interface Props {
  userId: string
  verified: boolean
  /** Empresa — shown so the admin knows what they are authenticating. */
  workPlace: string | null
  /** Puesto. */
  workPosition: string | null
  /** ISO timestamp of when the current verification was granted. */
  verifiedAt: string | null
}

function formatWhen(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

export function WorkVerificationToggle({
  userId,
  verified,
  workPlace,
  workPosition,
  verifiedAt,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Nothing to authenticate if the user has neither Empresa nor Puesto.
  const hasWorkInfo = Boolean(workPlace?.trim() || workPosition?.trim())

  const handleToggle = (next: boolean) => {
    setError(null)
    startTransition(async () => {
      const res = await setWorkVerificationAction(userId, next)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  const when = formatWhen(verifiedAt)

  return (
    <div>
      <div className="flex items-center gap-2">
        <CheckBadgeIcon
          className={`h-5 w-5 ${
            verified ? 'text-sky-500' : 'text-neutral-300 dark:text-neutral-600'
          }`}
        />
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {verified ? 'Empleo autenticado' : 'Empleo sin autenticar'}
        </span>
      </div>

      {verified && when && (
        <p className="mt-1 text-xs text-neutral-500">Autenticado el {when}</p>
      )}

      {!hasWorkInfo && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Este usuario aún no indica empresa ni puesto.
        </p>
      )}

      <div className="mt-3">
        {verified ? (
          <button
            type="button"
            onClick={() => handleToggle(false)}
            disabled={pending}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
          >
            {pending ? 'Quitando…' : 'Quitar verificación'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleToggle(true)}
            disabled={pending || !hasWorkInfo}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
          >
            <CheckBadgeIcon className="h-4 w-4" />
            {pending ? 'Verificando…' : 'Verificar empleo'}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <p className="mt-2 text-[11px] text-neutral-400">
        La autenticación se retira automáticamente si el usuario cambia su empresa o puesto.
      </p>
    </div>
  )
}
