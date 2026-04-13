/**
 * BlogsHero Component
 *
 * Hero section para la página de blogs.
 * Sección de bienvenida con información sobre blogs y botón de creación.
 */

import { DocumentTextIcon, PlusIcon, SparklesIcon, UserGroupIcon } from '@/components/icons/heroicons-shim'

import { BackgroundPattern } from '@/components/BackgroundPattern'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface BlogsHeroProps {
  className?: string
  onCreateClick?: () => void
  showCreateButton?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BlogsHero({ className, onCreateClick, showCreateButton }: BlogsHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl bg-linear-to-br from-secondary-700 via-secondary-800 to-secondary-900 px-6 py-8 md:px-12 md:py-10',
        className
      )}
    >
      {/* Background Pattern */}
      <BackgroundPattern opacity={0.1} color="white" />

      {/* Content */}
      <div className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">Blogs</h1>
          <p className="mt-3 text-base text-orange-100 md:text-lg">
            Comparte tu conocimiento y experiencias en tu espacio personal de publicación. Construye una audiencia y
            conecta con personas que comparten tus intereses.
          </p>

          {/* Create Button */}
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-secondary-900 shadow-lg transition-all hover:bg-orange-50 hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5" />
              Crear mi blog
            </button>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<DocumentTextIcon className="h-6 w-6" />}
            title="Publica Contenido"
            description="Crea y comparte artículos, historias y contenido multimedia con tu audiencia."
          />
          <FeatureCard
            icon={<UserGroupIcon className="h-6 w-6" />}
            title="Construye Audiencia"
            description="Gana seguidores interesados en tus temas y crea una comunidad activa."
          />
          <FeatureCard
            icon={<SparklesIcon className="h-6 w-6" />}
            title="Comparte Experiencia"
            description="Posiciónate como experto y comparte tu conocimiento con el mundo."
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
      <p className="text-sm text-orange-100">{description}</p>
    </div>
  )
}
