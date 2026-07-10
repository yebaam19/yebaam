import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { HeroSearch } from './HeroSearch'
import { HeroCategoryChips } from './HeroCategoryChips'
import { HeroStats } from './HeroStats'
import { HeroVisual } from './HeroVisual'

interface Props {
  stats?: {
    businesses?: number
    dishes?: number
    interactions?: number
  } | null
}

export function HeroSection({ stats }: Props) {
  return (
    <section
      className="relative overflow-hidden bg-white"
      aria-labelledby="hero-heading"
    >
      {/* Subtle background geometry — not generic blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Top-right accent: faint secondary mesh */}
        <div className="absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,156,49,0.06)_0%,transparent_70%)]" />
        {/* Bottom-left accent: primary green */}
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(22,164,76,0.06)_0%,transparent_70%)]" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[580px] grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-8">

            {/* Badge */}
            <div>
              <span
                className={[
                  'inline-flex items-center gap-2',
                  'rounded-full border border-primary-200/60 bg-primary-50',
                  'px-4 py-1.5 text-xs font-semibold text-primary-700',
                  'ring-1 ring-inset ring-primary-500/10',
                ].join(' ')}
              >
                <Sparkles size={13} aria-hidden="true" className="shrink-0" />
                <span>Descubrimiento gastronómico</span>
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1
                id="hero-heading"
                className={[
                  'text-5xl font-black leading-[1.05] tracking-tight text-neutral-950',
                  'sm:text-6xl lg:text-[64px]',
                ].join(' ')}
              >
                El sabor de tu ciudad,{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary-700">Yebaam te lo da</span>
                  {/* Underline accent */}
                  <span
                    className="absolute -bottom-1 left-0 z-0 h-3 w-full rounded-full bg-secondary-400/40"
                    aria-hidden="true"
                  />
                </span>
                .
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-neutral-500">
                Explora restaurantes locales, revisa sus menús con fotos reales, sigue los
                que más te gustan y descubre ofertas antes que nadie.
              </p>
            </div>

            {/* Search */}
            <HeroSearch />

            {/* Category chips */}
            <HeroCategoryChips />

            {/* Divider */}
            <hr className="border-neutral-100" />

            {/* CTA links */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/negocios"
                className={[
                  'inline-flex items-center gap-2 rounded-xl',
                  'bg-neutral-900 px-5 py-3 text-sm font-semibold text-white',
                  'transition-all duration-150',
                  'hover:bg-neutral-800 hover:-translate-y-px hover:shadow-lg hover:shadow-neutral-900/20',
                  'active:translate-y-0',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
                ].join(' ')}
              >
                Ver negocios
                <ChevronRight size={15} aria-hidden="true" />
              </Link>
              <Link
                href="/negocios/crear"
                className={[
                  'inline-flex items-center gap-2 rounded-xl border border-neutral-200',
                  'bg-white px-5 py-3 text-sm font-semibold text-neutral-700',
                  'transition-all duration-150',
                  'hover:border-neutral-300 hover:bg-neutral-50 hover:-translate-y-px',
                  'active:translate-y-0',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
                ].join(' ')}
              >
                Publica tu negocio
              </Link>
            </div>

            {/* Stats */}
            <HeroStats stats={stats} />
          </div>

          {/* ── RIGHT COLUMN ── */}
          <HeroVisual />
        </div>
      </div>
    </section>
  )
}
