'use client'

import { Search, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition, useId, type FormEvent } from 'react'

interface Props {
  defaultValue?: string
}

export function HeroSearch({ defaultValue = '' }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()
  const inputId = useId()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    startTransition(() => {
      router.push(`/negocios?q=${encodeURIComponent(q)}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} role="search" aria-label="Buscar restaurantes y comida">
      <label htmlFor={inputId} className="sr-only">
        Buscar restaurantes, platos o categorías
      </label>
      <div
        className={[
          'group flex items-center gap-0 overflow-hidden',
          'rounded-2xl bg-white ring-1 ring-neutral-200/80',
          'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)]',
          'transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-primary-500/60 focus-within:shadow-[0_4px_32px_-4px_rgba(22,164,76,0.20)]',
        ].join(' ')}
      >
        <span className="flex shrink-0 items-center pl-4 text-neutral-400 transition-colors group-focus-within:text-primary-600">
          {isPending ? (
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
          ) : (
            <Search size={20} aria-hidden="true" />
          )}
        </span>

        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Hamburguesas, sushi, pizza o nombre del negocio…"
          autoComplete="off"
          spellCheck={false}
          className={[
            'min-w-0 flex-1 bg-transparent py-4 pl-3 pr-2 text-base text-neutral-900',
            'placeholder:text-neutral-400 outline-none',
          ].join(' ')}
        />

        <div className="shrink-0 p-1.5">
          <button
            type="submit"
            disabled={isPending || !value.trim()}
            aria-label="Buscar"
            className={[
              'flex items-center gap-2 rounded-xl px-5 py-2.5',
              'bg-primary-700 text-sm font-semibold text-white',
              'transition-all duration-150',
              'hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-700/20 hover:-translate-y-px',
              'active:translate-y-0 active:shadow-none',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            ].join(' ')}
          >
            <span className="hidden sm:inline">Buscar</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Trending searches */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span>Tendencias:</span>
        {['Bandeja paisa', 'Burger gourmet', 'Sushi rolls', 'Postres artesanales'].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setValue(term)
              startTransition(() => {
                router.push(`/negocios?q=${encodeURIComponent(term)}`)
              })
            }}
            className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-600 transition hover:bg-primary-50 hover:text-primary-700"
          >
            {term}
          </button>
        ))}
      </div>
    </form>
  )
}
