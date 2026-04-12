/**
 * ServicesHero Component
 *
 * Hero section para la página de servicios profesionales.
 * Inspirado en el legacy pero con diseño moderno.
 */

import { BriefcaseIcon, CalendarIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline'

import { BackgroundPattern } from '@/components/BackgroundPattern'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface ServicesHeroProps {
  className?: string
  onCreateClick?: () => void
  showCreateButton?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ServicesHero({ className, onCreateClick, showCreateButton }: ServicesHeroProps) {
  return (
    <section
      className={cn('relative overflow-hidden rounded-2xl bg-feature-services px-6 py-8 md:px-12 md:py-10', className)}
    >
      {/* Background Pattern */}
      <BackgroundPattern opacity={0.1} color="white" />

      {/* Content */}
      <div className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">Servicios Profesionales</h1>
          <p className="mt-3 text-base text-green-100 md:text-lg">
            Encuentra profesionales verificados para todas tus necesidades. Desde abogados hasta desarrolladores,
            conecta con expertos cerca de ti.
          </p>

          {/* Create Button */}
          {showCreateButton && onCreateClick && (
            <button
              onClick={onCreateClick}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-green-900 shadow-lg transition-all hover:bg-green-50 hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5" />
              Crear mi servicio profesional
            </button>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<BriefcaseIcon className="h-6 w-6" />}
            title="Catálogo de Servicios"
            description="Explora una amplia variedad de servicios profesionales organizados por categoría."
          />
          <FeatureCard
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Gestión de Citas"
            description="Agenda citas directamente con los profesionales de tu elección."
          />
          <FeatureCard
            icon={<StarIcon className="h-6 w-6" />}
            title="Reputación Verificada"
            description="Consulta las reseñas y calificaciones de otros usuarios antes de contratar."
          />
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm">
      <div className="mb-3 inline-flex rounded-lg bg-white/20 p-2 text-white">{icon}</div>
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <p className="text-sm text-green-100">{description}</p>
    </div>
  )
}
