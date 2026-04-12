import { BriefcaseIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'

interface DirectoryHeroProps {
  cityName: string
  type?: 'main' | 'businesses' | 'services'
}

/**
 * Hero section para las páginas del directorio
 */
export function DirectoryHero({ cityName, type = 'main' }: DirectoryHeroProps) {
  const config = {
    main: {
      title: 'Directorio',
      subtitle: `Explora negocios y servicios profesionales en ${cityName}`,
      icon: null,
      bgColor: 'from-primary-600 to-primary-800',
    },
    businesses: {
      title: 'Negocios',
      subtitle: `Descubre los mejores negocios en ${cityName}`,
      icon: BuildingStorefrontIcon,
      bgColor: 'from-primary-600 to-primary-800',
    },
    services: {
      title: 'Servicios Profesionales',
      subtitle: `Encuentra profesionales de confianza en ${cityName}`,
      icon: BriefcaseIcon,
      bgColor: 'from-amber-500 to-amber-700',
    },
  }

  const { title, subtitle, icon: Icon, bgColor } = config[type]

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${bgColor} px-6 py-10 text-white md:px-10 md:py-14`}
    >
      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex items-center gap-4">
        {Icon && (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-8 w-8" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="mt-2 text-lg text-white/90">{subtitle}</p>
        </div>
      </div>

      {/* Elementos decorativos */}
      <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
    </div>
  )
}
