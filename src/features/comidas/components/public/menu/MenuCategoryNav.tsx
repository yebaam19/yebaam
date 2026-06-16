'use client'

export type MenuCategoryNavItem = {
  id: string
  label: string
}

export interface MenuCategoryNavProps {
  items: MenuCategoryNavItem[]
  activeId?: string | null
  onSelect?: (id: string) => void
}

export function MenuCategoryNav({ items, activeId, onSelect }: MenuCategoryNavProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = activeId === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item.id)}
            aria-current={active ? 'true' : undefined}
            className={[
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition',
              active
                ? 'bg-primary-700 text-white shadow-sm hover:bg-primary-800'
                : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950',
            ].join(' ')}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
