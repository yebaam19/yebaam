/**
 * ProfessionalBenefits Component
 *
 * Muestra los beneficios de tener un perfil profesional verificado
 */

'use client'

import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  RocketLaunchIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim'

const benefits = [
  {
    icon: CheckBadgeIcon,
    title: 'Verificacion Profesional',
    description: 'Obtén una insignia que certifica tu identidad y credenciales profesionales',
  },
  {
    icon: TrophyIcon,
    title: 'Credibilidad',
    description: 'Demuestra tus logros y certificaciones con documentacion verificada',
  },
  {
    icon: UserGroupIcon,
    title: 'Networking',
    description: 'Conecta con otros profesionales verificados de tu industria',
  },
  {
    icon: BuildingOfficeIcon,
    title: 'Oportunidades',
    description: 'Accede a ofertas laborales exclusivas para perfiles verificados',
  },
  {
    icon: BriefcaseIcon,
    title: 'Portafolio',
    description: 'Exhibe tu experiencia, proyectos y logros profesionales',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Visibilidad',
    description: 'Aumenta tu alcance y presencia en la comunidad profesional',
  },
]

export function ProfessionalBenefits() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Beneficios del Perfil Profesional</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Destaca entre la comunidad con un perfil profesional verificado
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary-500 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="mb-4 inline-flex rounded-lg bg-primary-50 p-3 text-primary-600 group-hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400">
              <benefit.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold text-neutral-900 dark:text-white">{benefit.title}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
