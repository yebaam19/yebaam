import { DocumentTextIcon } from '@/components/icons/heroicons-shim';
import type { FamilyStoryRow } from '../types/family.types';

export function FamilyStoriesList({ stories }: { stories: FamilyStoryRow[] }) {
  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <DocumentTextIcon className="h-10 w-10 text-zinc-400" />
        <h3 className="mt-3 text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Aún no hay historias
        </h3>
        <p className="mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Escribe anécdotas y recuerdos para que las próximas generaciones los conozcan.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {stories.map((s) => (
        <li
          key={s.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</h3>
            {s.event_date && (
              <time
                className="text-xs text-zinc-500"
                dateTime={s.event_date}
              >
                {new Date(s.event_date).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {s.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
