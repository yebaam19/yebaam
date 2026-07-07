'use client'

import { useRouter } from 'next/navigation'

interface Category {
  label: string
  emoji: string
  query: string
}

const CATEGORIES: Category[] = [
  { label: 'Pizza',       emoji: '🍕', query: 'pizza' },
  { label: 'Burger',      emoji: '🍔', query: 'hamburguesa' },
  { label: 'Sushi',       emoji: '🍱', query: 'sushi' },
  { label: 'Café',        emoji: '☕', query: 'cafe' },
  { label: 'Postres',     emoji: '🍰', query: 'postres' },
  { label: 'Desayunos',   emoji: '🥐', query: 'desayuno' },
  { label: 'Vegano',      emoji: '🥗', query: 'vegano' },
  { label: 'Mariscos',    emoji: '🦞', query: 'mariscos' },
]

export function HeroCategoryChips() {
  const router = useRouter()

  return (
    <nav aria-label="Categorías de comida">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
        Explorar por categoría
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="list"
      >
        {CATEGORIES.map(({ label, emoji, query }) => (
          <button
            key={label}
            type="button"
            role="listitem"
            onClick={() => router.push(`/negocios?q=${encodeURIComponent(query)}`)}
            className={[
              'group flex shrink-0 items-center gap-2 rounded-xl border border-neutral-200 bg-white',
              'px-3.5 py-2 text-sm font-medium text-neutral-700',
              'transition-all duration-150',
              'hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 hover:shadow-sm hover:-translate-y-px',
              'active:translate-y-0',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            ].join(' ')}
            aria-label={`Ver negocios de ${label}`}
          >
            <span
              className="text-base leading-none transition-transform duration-150 group-hover:scale-110"
              aria-hidden="true"
            >
              {emoji}
            </span>
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
