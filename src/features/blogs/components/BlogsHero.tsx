/**
 * BlogsHero Component
 *
 * Hero section para la página de blogs.
 * Banner compacto con gradiente + cuadrícula de beneficios.
 */

import { DocumentTextIcon, PlusIcon, SparklesIcon, UserGroupIcon } from '@/components/icons/heroicons-shim'

import { BackgroundPattern } from '@/components/BackgroundPattern'
import { cn } from '@/lib/utils'

interface BlogsHeroProps {
  className?: string
  onCreateClick?: () => void
  showCreateButton?: boolean
}

export function BlogsHero({ className, onCreateClick }: BlogsHeroProps) {
  return (
    <div className={cn('space-y-5 sm:space-y-6', className)}>
      {/* Compact gradient banner */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-secondary-600 via-secondary-700 to-secondary-900 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
        <BackgroundPattern opacity={0.08} color="white" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-secondary-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-100">
              Tu espacio personal
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Blogs</h1>
            <p className="text-sm text-white/85 sm:text-base">
              Comparte tu conocimiento, construye una audiencia y conecta con personas que comparten tus intereses.
            </p>
          </div>

          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-secondary-700 shadow-sm transition-colors hover:bg-secondary-50 sm:self-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Crear mi blog
            </button>
          )}
        </div>
      </section>

      {/* Feature grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={<DocumentTextIcon className="h-5 w-5" />}
          title="Publica contenido"
          description="Comparte artículos, historias y multimedia con tu audiencia."
          accent="from-secondary-500 to-secondary-700"
        />
        <FeatureCard
          icon={<UserGroupIcon className="h-5 w-5" />}
          title="Construye audiencia"
          description="Atrae seguidores interesados en tus temas y crea una comunidad activa."
          accent="from-primary-500 to-primary-700"
        />
        <FeatureCard
          icon={<SparklesIcon className="h-5 w-5" />}
          title="Comparte experiencia"
          description="Posiciónate como experto y aporta valor con tu conocimiento."
          accent="from-amber-500 to-rose-500"
        />
      </div>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accent: string
}

function FeatureCard({ icon, title, description, accent }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div
        className={cn(
          'mb-3 inline-flex items-center justify-center rounded-xl bg-linear-to-br p-2.5 text-white shadow-sm',
          accent
        )}
      >
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold tracking-tight text-neutral-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  )
}
