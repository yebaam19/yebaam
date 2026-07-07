interface Stat {
  value: string
  label: string
  description: string
}

interface Props {
  /** Pass null while loading — renders skeleton placeholders. */
  stats?: {
    businesses?: number
    dishes?: number
    interactions?: number
  } | null
}

function fmt(n: number): string {
  if (n >= 1000) return `+${(n / 1000).toFixed(1)}K`
  return `+${n}`
}

function StatItem({ value, label, description }: Stat) {
  return (
    <div className="flex flex-col" role="group" aria-label={`${label}: ${value}`}>
      <span className="text-2xl font-black tracking-tight text-neutral-900">{value}</span>
      <span className="text-sm font-semibold text-neutral-700">{label}</span>
      <span className="text-xs text-neutral-400">{description}</span>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-1" aria-hidden="true">
      <div className="h-8 w-16 animate-pulse rounded-lg bg-neutral-100" />
      <div className="h-4 w-20 animate-pulse rounded-lg bg-neutral-100" />
      <div className="h-3 w-24 animate-pulse rounded-lg bg-neutral-100" />
    </div>
  )
}

export function HeroStats({ stats }: Props) {
  const isLoading = stats === undefined
  const isEmpty = stats === null

  const items: Stat[] = isEmpty
    ? []
    : [
        {
          value: fmt(stats?.businesses ?? 0),
          label: 'Negocios activos',
          description: 'locales verificados',
        },
        {
          value: fmt(stats?.dishes ?? 0),
          label: 'Platos visibles',
          description: 'fotos, precios y más',
        },
        {
          value: fmt(stats?.interactions ?? 0),
          label: 'Interacciones',
          description: 'acciones directas en la plataforma',
        },
      ]

  return (
    <div
      className="flex flex-wrap items-start gap-x-8 gap-y-4"
      aria-label="Estadísticas de la plataforma"
    >
      {isLoading ? (
        <>
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </>
      ) : (
        items.map((stat) => <StatItem key={stat.label} {...stat} />)
      )}
    </div>
  )
}
