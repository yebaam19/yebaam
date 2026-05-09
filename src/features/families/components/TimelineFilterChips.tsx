'use client';

export type TimelineFilter = 'all' | 'event' | 'photo' | 'story' | 'document';

interface Props {
  value: TimelineFilter;
  counts: Record<TimelineFilter, number>;
  onChange: (value: TimelineFilter) => void;
}

const FILTERS: Array<{ value: TimelineFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'event', label: 'Eventos' },
  { value: 'photo', label: 'Fotos' },
  { value: 'story', label: 'Historias' },
  { value: 'document', label: 'Documentos' },
];

export function TimelineFilterChips({ value, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FILTERS.map((f) => {
        const active = value === f.value;
        const count = counts[f.value];
        const disabled = !active && count === 0 && f.value !== 'all';
        return (
          <button
            key={f.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(f.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : disabled
                  ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            <span>{f.label}</span>
            <span className={`text-[11px] ${active ? 'opacity-70' : 'opacity-60'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
