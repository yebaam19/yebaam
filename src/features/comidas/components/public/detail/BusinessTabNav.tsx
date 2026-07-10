'use client'

export type BusinessTab =
  | 'menu'
  | 'promociones'
  | 'fotos'
  | 'reseñas'
  | 'comunidad'
  | 'novedades'
  | 'detalles'

const TABS: { id: BusinessTab; label: string; emoji: string }[] = [
  { id: 'menu',       label: 'Carta',       emoji: '🍽️' },
  { id: 'novedades',  label: 'Novedades',   emoji: '📣' },
  { id: 'promociones',label: 'Ofertas',     emoji: '🏷️' },
  { id: 'fotos',      label: 'Fotos',       emoji: '📸' },
  { id: 'reseñas',    label: 'Reseñas',     emoji: '⭐' },
  { id: 'comunidad',  label: 'Comunidad',   emoji: '👥' },
  { id: 'detalles',   label: 'Datos útiles',emoji: 'ℹ️' },
]

interface Props {
  active: BusinessTab
  onChange: (tab: BusinessTab) => void
  counts?: Partial<Record<BusinessTab, number>>
}

export function BusinessTabNav({ active, onChange, counts }: Props) {
  return (
    <nav
      className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md"
      aria-label="Secciones del negocio"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="no-scrollbar flex gap-0 overflow-x-auto"
          role="tablist"
        >
          {TABS.map((tab) => {
            const count = counts?.[tab.id]
            const isActive = active === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => onChange(tab.id)}
                className={[
                  'relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3.5 text-sm font-medium transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
                  isActive
                    ? 'text-primary-700'
                    : 'text-neutral-500 hover:text-neutral-800',
                ].join(' ')}
              >
                {/* Active indicator — bottom border pill */}
                {isActive && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-700"
                    aria-hidden="true"
                  />
                )}

                <span className="text-base leading-none" aria-hidden="true">
                  {tab.emoji}
                </span>

                <span>{tab.label}</span>

                {/* Count badge */}
                {count !== undefined && count > 0 && (
                  <span
                    className={[
                      'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-100 text-neutral-500',
                    ].join(' ')}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
