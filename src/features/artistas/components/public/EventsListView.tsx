import Link from 'next/link'

export interface EventSummary {
  id: string
  slug?: string | null
  title: string
  description?: string | null
  starts_at: string
  location?: string | null
  is_published: boolean
}

function formatEventDate(iso: string) {
  const d = new Date(iso)
  return {
    day:   d.toLocaleDateString('es-ES', { day: '2-digit' }),
    month: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
    time:  d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  }
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date()
}

function EventCard({ item }: { item: EventSummary }) {
  const date = formatEventDate(item.starts_at)
  return (
    <Link
      href={`/artistas/eventos/${item.slug ?? item.id}` as never}
      className="flex overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-primary-700 py-4 text-white">
        <span className="text-2xl font-black leading-none">{date.day}</span>
        <span className="mt-0.5 text-xs font-semibold uppercase text-primary-200">{date.month}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-800 self-start">Evento</span>
        <h3 className="mt-2 text-sm font-black text-neutral-950 line-clamp-2">{item.title}</h3>
        {item.location && (
          <p className="mt-1.5 text-xs text-neutral-500 line-clamp-1">📍 {item.location}</p>
        )}
        <p className="mt-1 text-xs text-neutral-400">🕐 {date.time} hs</p>
        {item.description && (
          <p className="mt-2 flex-1 text-xs text-neutral-500 line-clamp-2">{item.description}</p>
        )}
      </div>
    </Link>
  )
}

export function EventsListView({ events }: { events: EventSummary[] }) {
  const upcoming = events.filter((e) => isUpcoming(e.starts_at))
  const past = events.filter((e) => !isUpcoming(e.starts_at))

  if (events.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <span className="text-2xl">📅</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">No hay eventos publicados</h3>
        <p className="mt-2 text-sm text-neutral-500">Los eventos culturales aparecerán aquí cuando sean publicados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {upcoming.length > 0 && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
            Próximos eventos ({upcoming.length})
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => <EventCard key={e.id} item={e} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Eventos pasados ({past.length})
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {past.map((e) => <EventCard key={e.id} item={e} />)}
          </div>
        </div>
      )}
    </div>
  )
}
