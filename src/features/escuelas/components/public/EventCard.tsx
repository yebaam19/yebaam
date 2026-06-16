const EVENT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  RECITAL:      { label: 'Recital',       color: 'bg-purple-100 text-purple-800', icon: '🎼' },
  AUDITION:     { label: 'Audición',      color: 'bg-yellow-100 text-yellow-800', icon: '🎤' },
  SHOWCASE:     { label: 'Muestra',       color: 'bg-teal-100 text-teal-800', icon: '🎭' },
  WORKSHOP:     { label: 'Taller',        color: 'bg-blue-100 text-blue-800', icon: '🛠️' },
  OPEN_CLASS:   { label: 'Clase abierta', color: 'bg-emerald-100 text-emerald-800', icon: '🎵' },
  EXHIBITION:   { label: 'Exposición',    color: 'bg-purple-100 text-purple-800', icon: '🖼️' },
  PRESENTATION: { label: 'Presentación',  color: 'bg-neutral-100 text-neutral-700', icon: '🎪' },
}

export interface SchoolEvent {
  id: string
  title: string
  description?: string | null
  event_type: string
  starts_at: string
  location?: string | null
}

function formatEventDate(iso: string) {
  const d = new Date(iso)
  return {
    day:   d.toLocaleDateString('es-ES', { day: '2-digit' }),
    month: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
    time:  d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  }
}

export function EventCard({ event: ev }: { event: SchoolEvent }) {
  const config = EVENT_CONFIG[ev.event_type] ?? { label: ev.event_type, color: 'bg-neutral-100 text-neutral-700', icon: '📅' }
  const date = formatEventDate(ev.starts_at)

  return (
    <article className="flex overflow-hidden rounded-[1.5rem] border border-[#dfeadf] bg-white shadow-sm transition hover:shadow-[0_8px_28px_rgba(29,65,35,0.10)]">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-[#006b2d] py-4 text-white">
        <span className="text-2xl font-black leading-none">{date.day}</span>
        <span className="mt-0.5 text-xs font-semibold uppercase text-[#a3d9b3]">{date.month}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
          {config.label}
        </span>
        <h3 className="mt-2 text-sm font-black text-[#151d18] line-clamp-2">{ev.title}</h3>
        {ev.location && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-[#5f6d61]">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{ev.location}</span>
          </p>
        )}
        <p className="mt-1 flex items-center gap-1 text-xs text-[#7a887b]">
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {date.time} hs
        </p>
        {ev.description && (
          <p className="mt-2 flex-1 text-xs leading-5 text-[#5f6d61] line-clamp-2">{ev.description}</p>
        )}
      </div>
    </article>
  )
}
