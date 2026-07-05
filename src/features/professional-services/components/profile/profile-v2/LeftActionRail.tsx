'use client'

import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  Squares2X2Icon,
} from '@/components/icons/heroicons-shim'

/**
 * Riel de acciones de la columna izquierda del perfil de servicio. Los tres
 * ítems son anclas a secciones de la columna principal: "Servicios"
 * (`#servicios`, sub-servicios del profesional), "Preguntas y Respuestas"
 * (`#preguntas`, módulo de Q&A) y "Consulta" (`#consulta`, tarjeta de contacto).
 */
export function LeftActionRail() {
  return (
    <nav aria-label="Acciones del perfil" className="flex flex-row gap-3 lg:flex-col">
      <RailLink href="#servicios" icon={Squares2X2Icon} label="Servicios" />
      <RailLink href="#preguntas" icon={ChatBubbleLeftRightIcon} label="Preguntas y Respuestas" />
      <RailLink href="#consulta" icon={PaperAirplaneIcon} label="Consulta" />
    </nav>
  )
}

interface RailLinkProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

function RailLink({ href, icon: Icon, label }: RailLinkProps) {
  return (
    <a
      href={href}
      className="group flex flex-1 items-center gap-2 rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 lg:flex-none dark:border-primary-900/40 dark:bg-neutral-800 dark:text-primary-300 dark:hover:bg-primary-900/20"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0 leading-tight">{label}</span>
    </a>
  )
}
