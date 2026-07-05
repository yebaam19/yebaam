'use client'

import Link from 'next/link'

interface ProviderDeclarationFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/**
 * Art. 12 (Manual de Convivencia): declaración obligatoria de autonomía del
 * prestador antes de publicar un servicio. Solo UI + validación por ahora —
 * persistir `provider_declaration_accepted_at` espera la migración en cola
 * (schema congelado en este pase). Texto fijo en español; las claves i18n de
 * este bloque quedan pendientes en `messages/`.
 */
export function ProviderDeclarationField({ checked, onChange, disabled }: ProviderDeclarationFieldProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        required
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-700"
      />
      <span className="text-sm text-neutral-700 dark:text-neutral-300">
        Declaro que ejerzo con plena autonomía técnica y administrativa y asumo mis obligaciones
        fiscales y de seguridad social. Yebaam actúa como portal de intermediación neutro.{' '}
        <Link
          href="/normativa/normas-comunitarias"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-600 underline hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Ver normas comunitarias
        </Link>
      </span>
    </label>
  )
}
