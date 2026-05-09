'use client';

import { useMemo, useState } from 'react';
import type {
  FamilyDocumentRow,
  FamilyEventRow,
  FamilyPhotoRow,
  FamilyStoryRow,
} from '../types/family.types';
import { TimelineFilterChips, type TimelineFilter } from './TimelineFilterChips';
import { TimelineEventCard } from './TimelineEventCard';
import { TimelinePhotoCard } from './TimelinePhotoCard';
import { TimelineStoryCard } from './TimelineStoryCard';
import { TimelineDocumentCard } from './TimelineDocumentCard';
import { TimelineEmptyState } from './TimelineEmptyState';

type TimelineKind = 'event' | 'photo' | 'story' | 'document';

interface TimelineEntry {
  kind: TimelineKind;
  id: string;
  date: string | null;
  createdAt: string;
  event?: FamilyEventRow;
  photo?: FamilyPhotoRow;
  story?: FamilyStoryRow;
  document?: FamilyDocumentRow;
}

interface Props {
  events: FamilyEventRow[];
  photos: FamilyPhotoRow[];
  stories: FamilyStoryRow[];
  documents: FamilyDocumentRow[];
  emptyActions?: React.ReactNode;
}

const NO_DATE_KEY = '__nodate__';

export function FamilyTimeline({ events, photos, stories, documents, emptyActions }: Props) {
  const [filter, setFilter] = useState<TimelineFilter>('all');

  const allEntries = useMemo<TimelineEntry[]>(() => {
    const list: TimelineEntry[] = [
      ...events.map<TimelineEntry>((e) => ({
        kind: 'event',
        id: e.id,
        date: e.event_date,
        createdAt: e.created_at,
        event: e,
      })),
      ...photos.map<TimelineEntry>((p) => ({
        kind: 'photo',
        id: p.id,
        date: p.taken_at,
        createdAt: p.created_at,
        photo: p,
      })),
      ...stories.map<TimelineEntry>((s) => ({
        kind: 'story',
        id: s.id,
        date: s.event_date,
        createdAt: s.created_at,
        story: s,
      })),
      ...documents.map<TimelineEntry>((d) => ({
        kind: 'document',
        id: d.id,
        date: null,
        createdAt: d.created_at,
        document: d,
      })),
    ];
    list.sort((a, b) => {
      if (a.date && b.date) return a.date < b.date ? 1 : -1;
      if (a.date) return -1;
      if (b.date) return 1;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
    return list;
  }, [events, photos, stories, documents]);

  const counts = useMemo<Record<TimelineFilter, number>>(
    () => ({
      all: allEntries.length,
      event: events.length,
      photo: photos.length,
      story: stories.length,
      document: documents.length,
    }),
    [allEntries.length, events.length, photos.length, stories.length, documents.length],
  );

  const filtered = useMemo(
    () => (filter === 'all' ? allEntries : allEntries.filter((e) => e.kind === filter)),
    [allEntries, filter],
  );

  const groups = useMemo(() => groupByDecade(filtered), [filtered]);

  if (allEntries.length === 0) {
    return <TimelineEmptyState filter="all" actions={emptyActions} />;
  }

  return (
    <div className="space-y-6">
      <TimelineFilterChips value={filter} counts={counts} onChange={setFilter} />

      {filtered.length === 0 ? (
        <TimelineEmptyState filter={filter} />
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <DecadeGroup key={g.key} label={g.label} entries={g.entries} />
          ))}
        </div>
      )}
    </div>
  );
}

function DecadeGroup({
  label,
  entries,
}: {
  label: string;
  entries: TimelineEntry[];
}) {
  return (
    <section>
      <header className="mb-4 flex items-baseline gap-3">
        <h3 className="text-2xl font-light text-zinc-300 dark:text-zinc-700">{label}</h3>
        <span className="text-xs text-zinc-400">
          {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
        </span>
      </header>
      <div className="space-y-4">
        {entries.map((e) => (
          <TimelineRow key={`${e.kind}-${e.id}`} entry={e} />
        ))}
      </div>
    </section>
  );
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  const dateBlock = formatDateBlock(entry.date, entry.createdAt);

  return (
    <div className="grid grid-cols-[64px_1fr] gap-4 sm:grid-cols-[88px_1fr]">
      <div className="pt-1 text-right">
        {dateBlock.day && (
          <p className="text-2xl font-light leading-none text-zinc-700 dark:text-zinc-300">
            {dateBlock.day}
          </p>
        )}
        {dateBlock.monthYear && (
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-zinc-500">
            {dateBlock.monthYear}
          </p>
        )}
        {!dateBlock.day && !dateBlock.monthYear && (
          <p className="text-[11px] text-zinc-400">{dateBlock.fallback}</p>
        )}
      </div>
      <div>
        {entry.event && <TimelineEventCard event={entry.event} />}
        {entry.photo && <TimelinePhotoCard photo={entry.photo} />}
        {entry.story && <TimelineStoryCard story={entry.story} />}
        {entry.document && <TimelineDocumentCard document={entry.document} />}
      </div>
    </div>
  );
}

interface DecadeBucket {
  key: string;
  label: string;
  entries: TimelineEntry[];
}

function groupByDecade(entries: TimelineEntry[]): DecadeBucket[] {
  const map = new Map<string, DecadeBucket>();
  for (const e of entries) {
    let key: string;
    let label: string;
    if (e.date) {
      const year = new Date(e.date).getUTCFullYear();
      const decade = Math.floor(year / 10) * 10;
      key = String(decade);
      label = `${decade}s`;
    } else {
      key = NO_DATE_KEY;
      label = 'Sin fecha';
    }
    const bucket = map.get(key);
    if (bucket) bucket.entries.push(e);
    else map.set(key, { key, label, entries: [e] });
  }
  // Sort buckets: dated buckets desc by decade, then no-date last.
  return Array.from(map.values()).sort((a, b) => {
    if (a.key === NO_DATE_KEY) return 1;
    if (b.key === NO_DATE_KEY) return -1;
    return Number(b.key) - Number(a.key);
  });
}

function formatDateBlock(
  date: string | null,
  createdAt: string,
): { day: string | null; monthYear: string | null; fallback: string } {
  if (date) {
    const d = new Date(date);
    return {
      day: String(d.getUTCDate()).padStart(2, '0'),
      monthYear: d
        .toLocaleDateString('es', { month: 'short', year: 'numeric', timeZone: 'UTC' })
        .replace('.', ''),
      fallback: '',
    };
  }
  return {
    day: null,
    monthYear: null,
    fallback: `agregado ${new Date(createdAt).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
    })}`,
  };
}
