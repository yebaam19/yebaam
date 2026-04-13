/**
 * ProfileSection Component
 *
 * Wrapper genérico para secciones del perfil
 */

import { PencilIcon } from '@/components/icons/heroicons-shim'
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
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>

        {isOwner && onEdit && (
          <button
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Editar información"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        )}

        {actionHref && actionLabel && (
          <a href={actionHref} className="text-primary text-sm font-medium hover:underline">
            {actionLabel}
          </a>
        )}
      </div>

      {children}
    </div>
  )
}
