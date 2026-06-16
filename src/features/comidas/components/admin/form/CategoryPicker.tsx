'use client'

interface Category {
  value: string
  label: string
  emoji: string
}

const CATEGORIES: Category[] = [
  { value: 'RESTAURANT', label: 'Restaurante',   emoji: '🍽️' },
  { value: 'CAFE',       label: 'Café',           emoji: '☕' },
  { value: 'BAKERY',     label: 'Panadería',      emoji: '🥐' },
  { value: 'PIZZA',      label: 'Pizzería',       emoji: '🍕' },
  { value: 'FAST_FOOD',  label: 'Comida rápida',  emoji: '🍔' },
  { value: 'ICE_CREAM',  label: 'Helados',        emoji: '🍦' },
  { value: 'BAR',        label: 'Bar',            emoji: '🍸' },
  { value: 'SEAFOOD',    label: 'Mariscos',       emoji: '🦞' },
  { value: 'SUSHI',      label: 'Japonés / Sushi',emoji: '🍱' },
  { value: 'VEGAN',      label: 'Vegano',         emoji: '🥗' },
]

interface Props {
  value: string
  onChange: (v: string) => void
  error?: string
}

export function CategoryPicker({ value, onChange, error }: Props) {
  return (
    <fieldset>
      <legend className="sr-only">Categoría del negocio (requerido)</legend>
      <div
        role="radiogroup"
        aria-label="Categoría del negocio"
        aria-required="true"
        aria-describedby={error ? 'category-error' : undefined}
        className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5"
      >
        {CATEGORIES.map((cat) => {
          const selected = value === cat.value
          return (
            <button
              key={cat.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(cat.value)}
              className={[
                'flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3.5 text-center transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
                selected
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50',
              ].join(' ')}
            >
              <span className="text-2xl leading-none" aria-hidden="true">{cat.emoji}</span>
              <span
                className={[
                  'text-xs font-medium leading-tight',
                  selected ? 'text-primary-700' : 'text-neutral-600',
                ].join(' ')}
              >
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p id="category-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
    </fieldset>
  )
}
