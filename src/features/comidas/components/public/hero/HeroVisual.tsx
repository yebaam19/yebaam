/** Visual column — purely decorative/presentational, no data fetching.
 *  The cards represent the product concept and are designed to be replaced
 *  with real BusinessCard data once a "featured businesses" RPC is available.
 */

interface FeaturedCard {
  name: string
  category: string
  rating: number
  tag: string
  gradient: string
  emoji: string
  delay: string
}

const FEATURED: FeaturedCard[] = [
  {
    name: 'Café del Parque',
    category: 'Café & Brunch',
    rating: 4.9,
    tag: 'Tendencia',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    emoji: '☕',
    delay: 'delay-0',
  },
  {
    name: 'Burger House',
    category: 'Hamburguesas',
    rating: 4.7,
    tag: 'Nuevo',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    emoji: '🍔',
    delay: 'delay-100',
  },
  {
    name: 'Sushi Ko',
    category: 'Japonesa',
    rating: 4.8,
    tag: 'Popular',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
    emoji: '🍱',
    delay: 'delay-200',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Calificación: ${rating} de 5`}>
      <span className="text-[10px] text-yellow-400" aria-hidden="true">★★★★★</span>
      <span className="text-xs font-bold text-white/90">{rating}</span>
    </div>
  )
}

function RestaurantCard({ card, index }: { card: FeaturedCard; index: number }) {
  const rotations = ['-rotate-1', 'rotate-1', '-rotate-2']
  const scales = index === 0 ? 'scale-100 z-30' : index === 1 ? 'scale-95 z-20' : 'scale-90 z-10'

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl',
        'shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)]',
        `bg-gradient-to-br ${card.gradient}`,
        rotations[index] ?? '',
        scales,
        'transition-all duration-500 hover:scale-[1.02] hover:rotate-0 hover:z-40 hover:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)]',
        `animate-fadeSlideIn ${card.delay}`,
      ].join(' ')}
      aria-hidden="true"
    >
      <div className="flex flex-col gap-3 p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm"
          >
            {card.emoji}
          </div>
          <span className="rounded-full bg-white/25 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {card.tag}
          </span>
        </div>

        {/* Name + category */}
        <div>
          <p className="text-lg font-bold leading-tight text-white">{card.name}</p>
          <p className="text-xs font-medium text-white/70">{card.category}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/20 pt-3">
          <StarRating rating={card.rating} />
          <span className="rounded-xl bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Ver menú →
          </span>
        </div>
      </div>
    </div>
  )
}

/** Floating badge that overlays the card stack with a social-proof signal. */
function FloatingBadge({
  icon,
  text,
  sub,
  position,
}: {
  icon: string
  text: string
  sub: string
  position: string
}) {
  return (
    <div
      className={[
        'absolute z-50 flex items-center gap-2.5',
        'rounded-2xl bg-white px-3.5 py-2.5',
        'shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)]',
        'ring-1 ring-neutral-100/80',
        'animate-float',
        position,
      ].join(' ')}
      aria-hidden="true"
    >
      <span className="text-lg leading-none">{icon}</span>
      <div>
        <p className="text-xs font-bold text-neutral-900">{text}</p>
        <p className="text-[10px] text-neutral-400">{sub}</p>
      </div>
    </div>
  )
}

export function HeroVisual() {
  return (
    <div
      className="relative hidden lg:flex lg:items-center lg:justify-center"
      aria-hidden="true"
    >
      {/* Ambient glow behind cards */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-secondary-500/20 blur-3xl" />
      </div>

      {/* Card stack */}
      <div className="relative flex flex-col gap-4 px-6 py-4">
        {FEATURED.map((card, i) => (
          <RestaurantCard key={card.name} card={card} index={i} />
        ))}
      </div>

      {/* Floating social-proof badges */}
      <FloatingBadge
        icon="⭐"
        text="4.9 promedio"
        sub="Más de 200 reseñas"
        position="-left-6 top-12"
      />
      <FloatingBadge
        icon="✅"
        text="Verificados"
        sub="Negocios reales"
        position="-right-4 top-1/2 -translate-y-1/2"
      />
      <FloatingBadge
        icon="🔥"
        text="En tendencia"
        sub="Esta semana"
        position="-left-4 bottom-16"
      />
    </div>
  )
}
