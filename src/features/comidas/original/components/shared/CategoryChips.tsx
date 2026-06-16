
export interface CategoryItem {
  label: string
  value: string
  count?: number
}

export interface CategoryChipsProps {
  items: CategoryItem[]
  selected?: string
  onSelect?: (value: string) => void
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function CategoryChips({
  items,
  selected,
  onSelect,
}: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected === item.value

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect?.(item.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
              active
                ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}