import { useEffect, useState } from 'react';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import Badge, { type BadgeVariant } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import type { SchoolEvent } from '../../types';

const EVENT_CONFIG: Record<string, { label: string; variant: BadgeVariant; icon: string }> = {
  RECITAL:      { label: 'Recital',        variant: 'purple',  icon: '🎼' },
  AUDITION:     { label: 'Audición',       variant: 'warning', icon: '🎤' },
  SHOWCASE:     { label: 'Muestra',        variant: 'teal',    icon: '🎭' },
  WORKSHOP:     { label: 'Taller',         variant: 'info',    icon: '🛠️' },
  OPEN_CLASS:   { label: 'Clase abierta',  variant: 'success', icon: '🎵' },
  EXHIBITION:   { label: 'Exposición',     variant: 'purple',  icon: '🖼️' },
  PRESENTATION: { label: 'Presentación',   variant: 'default', icon: '🎪' },
};

function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    day:   d.toLocaleDateString('es-ES', { day: '2-digit' }),
    month: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
    full:  d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time:  d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

export default function EventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    api.get<{ ok: boolean; data: SchoolEvent[] }>('/events')
      .then((r) => setEvents(r.data.data))
      .catch((e: { message?: string }) => setError(e.message ?? 'No se pudo cargar eventos'))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = events.filter((e) => isUpcoming(e.startsAt));
  const past     = events.filter((e) => !isUpcoming(e.startsAt));

  return (
    <div className="min-h-screen bg-[#f3fcf3]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006b2d]">Agenda</p>
          <h1 className="mt-1 text-3xl font-black text-[#151d18]">Eventos artísticos</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f6d61]">
            Recitales, audiciones, talleres abiertos y muestras de fin de ciclo.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <EmptyState title="No se pudieron cargar los eventos" description={error} />
        ) : events.length ? (
          <div className="space-y-10">
            {upcoming.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#006b2d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#006b2d]" aria-hidden="true" />
                  Próximos eventos ({upcoming.length})
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((ev) => <EventCard key={ev.id} event={ev} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#7a887b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7a887b]" aria-hidden="true" />
                  Eventos pasados ({past.length})
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
                  {past.map((ev) => <EventCard key={ev.id} event={ev} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="Sin eventos próximos"
            description="Las escuelas publicarán nuevas fechas de recitales, audiciones y talleres abiertos pronto."
            icon={
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        )}
      </section>
    </div>
  );
}

function EventCard({ event: ev }: { event: SchoolEvent }) {
  const config = EVENT_CONFIG[ev.eventType] ?? { label: ev.eventType, variant: 'default' as BadgeVariant, icon: '📅' };
  const date   = formatEventDate(ev.startsAt);

  return (
    <article className="flex overflow-hidden rounded-2xl border border-[#dfeadf] bg-white shadow-sm transition hover:shadow-[0_8px_28px_rgba(29,65,35,0.10)]">
      {/* Date block */}
      <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-[#006b2d] py-4 text-white">
        <span className="text-2xl font-black leading-none">{date.day}</span>
        <span className="mt-0.5 text-xs font-semibold uppercase text-[#a3d9b3]">{date.month}</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={config.variant} className="shrink-0">{config.label}</Badge>
        </div>
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
  );
}
