import {
  CakeIcon,
  HeartIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  CalendarIcon,
} from '@/components/icons/heroicons-shim';
import type { FamilyEventRow, FamilyEventType } from '../types/family.types';
import { PersonChipList } from './PersonAvatarChip';

const EVENT_LABEL: Record<FamilyEventType, string> = {
  birth: 'Nacimiento',
  marriage: 'Matrimonio',
  divorce: 'Divorcio',
  death: 'Defunción',
  graduation: 'Graduación',
  migration: 'Migración',
  adoption: 'Adopción',
  custom: 'Evento',
};

const EVENT_ACCENT: Record<FamilyEventType, string> = {
  birth: 'bg-emerald-400',
  marriage: 'bg-rose-400',
  divorce: 'bg-amber-400',
  death: 'bg-zinc-400',
  graduation: 'bg-indigo-400',
  migration: 'bg-sky-400',
  adoption: 'bg-fuchsia-400',
  custom: 'bg-zinc-400',
};

const EVENT_ICON: Record<FamilyEventType, typeof CalendarIcon> = {
  birth: CakeIcon,
  marriage: HeartIcon,
  divorce: HeartIcon,
  death: CalendarIcon,
  graduation: AcademicCapIcon,
  migration: GlobeAltIcon,
  adoption: CalendarIcon,
  custom: CalendarIcon,
};

export function TimelineEventCard({ event }: { event: FamilyEventRow }) {
  const Icon = EVENT_ICON[event.event_type];
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`h-1 w-full ${EVENT_ACCENT[event.event_type]}`} aria-hidden />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Icon className="h-3.5 w-3.5" />
          <span>{EVENT_LABEL[event.event_type]}</span>
          {event.event_place && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{event.event_place}</span>
            </>
          )}
        </div>
        <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {event.title}
        </h3>
        {event.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {event.description}
          </p>
        )}
        {event.tagged_persons && event.tagged_persons.length > 0 && (
          <div className="mt-3">
            <PersonChipList persons={event.tagged_persons} />
          </div>
        )}
      </div>
    </article>
  );
}
