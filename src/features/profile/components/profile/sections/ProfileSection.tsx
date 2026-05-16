/**
 * ProfileSection Component
 *
 * Wrapper genérico para secciones del perfil. Estilo minimalista: borde fino
 * en lugar de sombra, título mediano para reducir peso visual.
 */

'use client'

import { PencilIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

interface ProfileSectionProps {
  title: string
  children: ReactNode
  isOwner?: boolean
  onEdit?: () => void
  actionLabel?: string
  actionHref?: string
  className?: string
}

export default function ProfileSection({
  title,
  children,
  isOwner = false,
  onEdit,
  actionLabel,
  actionHref,
  className = '',
}: ProfileSectionProps) {
  const t = useTranslations('profile.section')
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>

        {isOwner && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            title={t('edit')}
            aria-label={t('editAria', { title: title.toLowerCase() })}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}

        {actionHref && actionLabel && (
          <a
            href={actionHref}
            className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {actionLabel}
          </a>
        )}
      </div>

      {children}
    </section>
  )
}
