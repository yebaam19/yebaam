import { ClockIcon } from '@/components/icons/heroicons-shim';
import type { TimelineFilter } from './TimelineFilterChips';

const FILTER_COPY: Record<Exclude<TimelineFilter, 'all'>, { title: string; hint: string }> = {
  event: {
    title: 'Sin eventos registrados',
    hint: 'Los eventos aparecen aquí cuando agregas nacimientos, bodas, viajes o cualquier otro hito.',
  },
  photo: {
    title: 'Aún no hay fotos',
    hint: 'Sube fotos con fecha para ir construyendo la línea de tiempo visual.',
  },
  story: {
    title: 'Aún no hay historias',
    hint: 'Escribe historias o anécdotas familiares para preservar la memoria.',
  },
  document: {
    title: 'Aún no hay documentos',
    hint: 'Adjunta actas, cartas u otros documentos importantes.',
  },
};

interface Props {
  filter: TimelineFilter;
  actions?: React.ReactNode;
}

export function TimelineEmptyState({ filter, actions }: Props) {
  const copy =
    filter === 'all'
      ? {
          title: 'La línea de tiempo está vacía',
          hint: 'A medida que agregues eventos, fotos, historias y documentos, aparecerán aquí ordenados por fecha.',
        }
      : FILTER_COPY[filter];

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
      <ClockIcon className="h-9 w-9 text-zinc-400" />
      <h3 className="mt-3 text-base font-semibold text-zinc-800 dark:text-zinc-100">
        {copy.title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">{copy.hint}</p>
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
