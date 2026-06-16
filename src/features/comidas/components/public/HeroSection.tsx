'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export function HeroSection() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/negocios?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-orange-200 blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-200 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-rose-100 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            Descubre qué pedir
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Encuentra comida que sí se te antoje.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
            Explora negocios locales, revisa cartas, compara ofertas, mira fotos reales
            y decide con menos vueltas.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca hamburguesas, pizzas, combos o negocios"
                className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/10"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-2xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-800"
            >
              Explorar
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/negocios"
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Ver negocios destacados
            </Link>
            <Link
              href="/publicar-negocio"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Publicar mi negocio
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-neutral-500">
            <div>
              <span className="block text-xl font-bold text-neutral-900">+120</span>
              negocios activos
            </div>
            <div>
              <span className="block text-xl font-bold text-neutral-900">+850</span>
              platos visibles
            </div>
            <div>
              <span className="block text-xl font-bold text-neutral-900">+2.4K</span>
              acciones directas
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
