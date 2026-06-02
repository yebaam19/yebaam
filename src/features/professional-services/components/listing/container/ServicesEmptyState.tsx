import { PlusIcon } from '@/components/icons/heroicons-shim'

export interface ServicesEmptyStateProps {
  type: 'my-services' | 'suggested' | 'discover' | 'search'
  onCreateClick: () => void
  onClearSearch?: () => void
  onDiscoverClick?: () => void
}

/** Empty-state card for each directory tab / search result set. */
export function ServicesEmptyState({ type, onCreateClick, onClearSearch, onDiscoverClick }: ServicesEmptyStateProps) {
  const config = {
    'my-services': {
      title: 'No tienes servicios profesionales',
      description: 'Crea tu primer servicio profesional y empieza a ofrecer tus servicios a la comunidad.',
      action: 'Crear mi primer servicio',
      onAction: onCreateClick,
    },
    suggested: {
      title: 'Sin sugerencias disponibles',
      description: 'No hay servicios sugeridos para ti en este momento. Explora la sección Descubrir.',
      action: 'Explorar servicios',
      onAction: onDiscoverClick,
    },
    discover: {
      title: 'No hay servicios disponibles',
      description: 'Sé el primero en crear un servicio profesional.',
      action: 'Crear servicio',
      onAction: onCreateClick,
    },
    search: {
      title: 'Sin resultados',
      description: 'No encontramos servicios que coincidan con tu búsqueda. Intenta con otros términos.',
      action: 'Limpiar búsqueda',
      onAction: onClearSearch,
    },
  }

  const { title, description, action, onAction } = config[type]

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 py-16 text-center dark:border-neutral-700">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <PlusIcon className="h-8 w-8 text-neutral-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mb-6 max-w-md text-neutral-600 dark:text-neutral-400">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
        >
          {action}
        </button>
      )}
    </div>
  )
}
