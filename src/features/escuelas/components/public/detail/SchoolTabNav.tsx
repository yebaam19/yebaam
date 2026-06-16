'use client'

export type SchoolTab = 'programas' | 'instructores' | 'galeria' | 'resenas' | 'contacto'

const TABS: { id: SchoolTab; label: string }[] = [
  { id: 'programas', label: 'Cursos' },
  { id: 'instructores', label: 'Docentes' },
  { id: 'galeria', label: 'Fotos' },
  { id: 'resenas', label: 'Reseñas' },
  { id: 'contacto', label: 'Contacto' },
]

interface Props {
  active: SchoolTab
  onChange: (tab: SchoolTab) => void
  counts?: Partial<Record<SchoolTab, number>>
}

export function SchoolTabNav({ active, onChange, counts }: Props) {
  return (
    <nav
      className="sticky top-0 z-30 border-y border-primary-100 bg-primary-50/95 backdrop-blur-md"
      aria-label="Secciones de la escuela"
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 hide-scrollbar sm:px-6 lg:px-8">
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
                'whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition',
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-neutral-700 hover:bg-white hover:text-primary-700',
              ].join(' ')}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className={['ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-white/25' : 'bg-primary-100 text-primary-700'].join(' ')}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
