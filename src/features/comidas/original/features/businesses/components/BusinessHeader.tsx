import Badge from '../../../components/ui/Badge'

export interface BusinessHeaderProps {
  name: string
  category: string
  coverImage: string
  logoImage?: string
  description: string
  rating: number
  reviewsCount: number
  location?: string
  schedule?: string
  isOpen?: boolean
  promoLabel?: string
}

export default function BusinessHeader({
  name,
  category,
  coverImage,
  logoImage,
  description,
  rating,
  reviewsCount,
  location,
  schedule,
  isOpen = true,
  promoLabel,
}: BusinessHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <img
          src={coverImage}
          alt={name}
          className="h-64 w-full object-cover md:h-80"
        />

        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <Badge>{category}</Badge>
          <Badge variant={isOpen ? 'success' : 'neutral'}>
            {isOpen ? 'Abierto ahora' : 'Cerrado'}
          </Badge>
          {promoLabel && <Badge variant="warning">{promoLabel}</Badge>}
        </div>
      </div>

      <div className="px-5 py-6 md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            {logoImage ? (
              <img
                src={logoImage}
                alt={`${name} logo`}
                className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-lg font-bold text-white shadow-sm">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {name}
              </h1>

              <p className="mt-2 text-base leading-7 text-slate-600">
                {description}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-slate-50 px-3 py-1">
                  ⭐ {rating.toFixed(1)} · {reviewsCount} reseñas
                </span>
                {location && (
                  <span className="rounded-full bg-slate-50 px-3 py-1">
                    📍 {location}
                  </span>
                )}
                {schedule && (
                  <span className="rounded-full bg-slate-50 px-3 py-1">
                    🕒 {schedule}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}