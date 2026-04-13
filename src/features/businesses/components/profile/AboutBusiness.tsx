'use client'

/**
 * AboutBusiness Component
 *
 * Sección de descripción "Acerca del negocio" con estados expandido/colapsado.
 */

import { ChevronDownIcon, ChevronUpIcon, InformationCircleIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'

interface AboutBusinessProps {
  /** Descripción del negocio */
  description?: string | null
  /** Número máximo de líneas antes de colapsar */
  maxLines?: number
}

/**
 * Componente que muestra la descripción del negocio
 */
export function AboutBusiness({ description, maxLines = 4 }: AboutBusinessProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!description) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <InformationCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Acerca del negocio</h2>
        </div>

        <div className="mt-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-700/50">
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Este negocio aún no ha agregado una descripción.
          </p>
        </div>
      </div>
    )
  }

  // Calcular si el texto es lo suficientemente largo para necesitar expandirse
  const needsExpansion = description.length > 300 || description.split('\n').length > maxLines

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <InformationCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Acerca del negocio</h2>
      </div>

      {/* Description Content */}
      <div className="mt-4">
        <div
          className={`prose max-w-none text-neutral-700 prose-neutral dark:text-neutral-300 dark:prose-invert ${
            !isExpanded && needsExpansion ? `line-clamp-${maxLines}` : ''
          }`}
          style={
            !isExpanded && needsExpansion
              ? { WebkitLineClamp: maxLines, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }
              : {}
          }
        >
          {description.split('\n').map((paragraph, index) => (
            <p key={index} className={index > 0 ? 'mt-3' : ''}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Expand/Collapse Button */}
        {needsExpansion && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {isExpanded ? (
              <>
                <span>Ver menos</span>
                <ChevronUpIcon className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Ver más</span>
                <ChevronDownIcon className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
