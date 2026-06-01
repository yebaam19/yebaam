'use client'

import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  Squares2X2Icon,
} from '@/components/icons/heroicons-shim'

/**
 * Riel de acciones de la columna izquierda del perfil de servicio.
 * - "Servicios" y "Preguntas y Respuestas" son marcadores (Próximamente): no
 *   existe aún una sub-entidad de servicios ni el módulo de Q&A está enlazado.
 * - "Consulta" hace scroll a la tarjeta de contacto (`#consulta`).
 */
export function LeftActionRail() {
  return (
    <nav aria-label="Acciones del perfil" className="flex flex-row gap-3 lg:flex-col">
      <RailButton
        icon={Squares2X2Icon}
        label="Servicios"
        comingSoon
      />
      <RailButton
        icon={ChatBubbleLeftRightIcon}
        label="Preguntas y Respuestas"
        comingSoon
      />
      <a
        href="#consulta"
        className="group flex flex-1 items-center gap-2 rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 lg:flex-none dark:border-primary-900/40 dark:bg-neutral-800 dark:text-primary-300 dark:hover:bg-primary-900/20"
      >
        <PaperAirplaneIcon className="h-5 w-5 shrink-0" />
        <span>Consulta</span>
      </a>
    </nav>
  )
}

interface RailButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  comingSoon?: boolean
}

function RailButton({ icon: Icon, label, comingSoon }: RailButtonProps) {
  return (
    <button
      type="button"
      disabled={comingSoon}
      title={comingSoon ? 'Próximamente' : undefined}
      className="group relative flex flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-semibold text-neutral-700 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 lg:flex-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
    >
      <Icon className="h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {comingSoon && (
          <span className="block text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
            Próximamente
          </span>
        )}
      </span>
    </button>
  )
}
