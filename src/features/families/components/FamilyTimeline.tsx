import {
  CalendarIcon,
  ClockIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type {
  FamilyDocumentRow,
  FamilyEventRow,
  FamilyEventType,
  FamilyPhotoRow,
  FamilyStoryRow,
} from '../types/family.types';

type TimelineKind = 'event' | 'photo' | 'story' | 'document';

interface TimelineItem {
  kind: TimelineKind;
  id: string;
  title: string;
  subtitle?: string;
  date: string | null;
  createdAt: string;
  cfImageId?: string;
  body?: string;
  eventType?: FamilyEventType;
}

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

interface Props {
  events: FamilyEventRow[];
  photos: FamilyPhotoRow[];
  stories: FamilyStoryRow[];
  documents: FamilyDocumentRow[];
}

export function FamilyTimeline({ events, photos, stories, documents }: Props) {
  const items: TimelineItem[] = [
    ...events.map<TimelineItem>((e) => ({
      kind: 'event',
      id: e.id,
      title: e.title,
      subtitle: [EVENT_LABEL[e.event_type], e.event_place].filter(Boolean).join(' · '),
      date: e.event_date,
      createdAt: e.created_at,
      body: e.description ?? undefined,
      eventType: e.event_type,
    })),
    ...photos.map<TimelineItem>((p) => ({
      kind: 'photo',
      id: p.id,
      title: p.caption || 'Foto familiar',
      subtitle: 'Foto',
      date: p.taken_at,
      createdAt: p.created_at,
      cfImageId: p.cf_image_id,
    })),
    ...stories.map<TimelineItem>((s) => ({
      kind: 'story',
      id: s.id,
      title: s.title,
      subtitle: 'Historia',
      date: s.event_date,
      createdAt: s.created_at,
      body: s.body,
    })),
    ...documents.map<TimelineItem>((d) => ({
      kind: 'document',
      id: d.id,
      title: d.title,
      subtitle: 'Documento',
      date: null,
      createdAt: d.created_at,
    })),
  ];

  // Sort: items with a `date` first, by date desc; then dateless by createdAt desc.
  items.sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? 1 : -1;
    if (a.date) return -1;
    if (b.date) return 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <ClockIcon className="h-10 w-10 text-zinc-400" />
        <h3 className="mt-3 text-base font-semibold text-zinc-800 dark:text-zinc-100">
          La línea de tiempo está vacía
        </h3>
        <p className="mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          A medida que agregues eventos, fotos, historias y documentos, aparecerán aquí ordenados por fecha.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-zinc-200 pl-6 dark:border-zinc-800">
      {items.map((item) => (
        <TimelineRow key={`${item.kind}-${item.id}`} item={item} />
      ))}
    </ol>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const Icon = ICON_BY_KIND[item.kind];
  const dateText = item.date
    ? new Date(item.date).toLocaleDateString('es', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : `Sin fecha · agregado ${new Date(item.createdAt).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`;

  return (
    <li className="relative">
      <span
        className={`absolute -left-9 top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-950 ${COLOR_BY_KIND[item.kind]}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
          <time className="text-xs text-zinc-500">{dateText}</time>
        </div>
        {item.subtitle && (
          <p className="mt-0.5 text-xs uppercase tracking-wide text-zinc-500">{item.subtitle}</p>
        )}
        {item.kind === 'photo' && item.cfImageId && (
          <a
            href={imageUrl(item.cfImageId, 'public')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block overflow-hidden rounded-lg"
          >
            <img
              src={imageUrl(item.cfImageId, 'public')}
              alt={item.title}
              className="max-h-72 w-full object-cover"
              loading="lazy"
            />
          </a>
        )}
        {item.body && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {item.body}
          </p>
        )}
      </div>
    </li>
  );
}

const ICON_BY_KIND: Record<TimelineKind, typeof CalendarIcon> = {
  event: CalendarIcon,
  photo: PhotoIcon,
  story: DocumentTextIcon,
  document: DocumentIcon,
};

const COLOR_BY_KIND: Record<TimelineKind, string> = {
  event: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  photo: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  story: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  document: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};
