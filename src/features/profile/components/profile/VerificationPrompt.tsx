'use client'

/**
 * VerificationPrompt Component
 *
 * Prompt para que los usuarios verifiquen su cuenta
 */

import { ExclamationCircleIcon } from '@/components/icons/heroicons-shim'
import type { UserProfile } from '../../interfaces/profile.interfaces'

interface VerificationPromptProps {
  user: UserProfile
}

export default function VerificationPrompt({ user }: VerificationPromptProps) {
  if (user.documentStatus === 'ACCEPTED' || user.documentStatus === 'PENDING') {
    return null
  }

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
      <div className="flex items-start gap-3">
        <ExclamationCircleIcon className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-500" />
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-yellow-900 dark:text-yellow-100">Verifica tu cuenta</h3>
          <p className="mb-3 text-sm text-yellow-800 dark:text-yellow-200">
            Verifica tu identidad para obtener una insignia de verificación y acceder a más funciones.
          </p>
          <button className="text-sm font-medium text-yellow-900 underline hover:no-underline dark:text-yellow-100">
            Iniciar verificación
          </button>
        </div>
      </div>
    </div>
  )
}
