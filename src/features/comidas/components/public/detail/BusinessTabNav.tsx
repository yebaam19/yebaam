'use client'

export type BusinessTab = 'menu' | 'promociones' | 'fotos' | 'reseñas' | 'comunidad' | 'novedades' | 'detalles'

const TABS: { id: BusinessTab; label: string }[] = [
  { id: 'menu', label: 'Carta' },
  { id: 'novedades', label: 'Novedades' },
  { id: 'promociones', label: 'Ofertas' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'reseñas', label: 'Reseñas' },
  { id: 'comunidad', label: 'Comunidad' },
  { id: 'detalles', label: 'Datos útiles' },
]

interface Props {
  active: BusinessTab
  onChange: (tab: BusinessTab) => void
  counts?: Partial<Record<BusinessTab, number>>
}

export function BusinessTabNav({ active, onChange, counts }: Props) {
  return (
    <nav
      className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white/95 px-4 py-2 backdrop-blur-md sm:px-6 lg:px-8 hide-scrollbar"
      aria-label="Secciones del negocio"
    >
      {TABS.map((tab) => {
        const count = counts?.[tab.id]
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition duration-150',
              isActive
                ? 'bg-primary-700 text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
            ].join(' ')}
          >
            {tab.label}
            {count !== undefined && count > 0 && (
              <span className={['ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                isActive ? 'bg-white/25' : 'bg-neutral-100 text-neutral-500'].join(' ')}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
