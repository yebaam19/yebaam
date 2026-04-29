'use client';

import {
  categoryLabel,
  distinctionLabel,
  studyTypeLabel,
} from '@/features/professional-profile/lib/credentials';
import type {
  StudyType,
  TitleCategory,
  TitleDistinction,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';

interface Props {
  kind: 'title' | 'study';
  snapshot: Record<string, unknown>;
  current: Record<string, unknown> | null;
}

function fmtTitle(v: Record<string, unknown>) {
  return {
    name: (v.name as string | null) ?? '—',
    category: categoryLabel((v.category as TitleCategory | null) ?? null) || '—',
    distinction: distinctionLabel((v.distinction as TitleDistinction | null) ?? null) || '—',
    institution: (v.institution as string | null) ?? '—',
    year: v.year != null ? String(v.year) : '—',
  };
}

function fmtStudy(v: Record<string, unknown>) {
  return {
    name: (v.name as string | null) ?? '—',
    study_type: studyTypeLabel((v.study_type as StudyType | null) ?? null) || '—',
    institution: (v.institution as string | null) ?? '—',
    year: v.year != null ? String(v.year) : '—',
  };
}

export default function MaterialEditDiff({ kind, snapshot, current }: Props) {
  const before = kind === 'title' ? fmtTitle(snapshot) : fmtStudy(snapshot);
  const after = kind === 'title' ? fmtTitle(current ?? {}) : fmtStudy(current ?? {});
  const fields = Object.keys(before) as Array<keyof typeof before>;

  return (
    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-700/40 dark:bg-amber-900/20">
      <p className="mb-2 font-semibold text-amber-800 dark:text-amber-300">
        Edición material — comparación
      </p>
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <th className="w-1/4 py-1">Campo</th>
            <th className="w-3/8 py-1">Verificado anterior</th>
            <th className="w-3/8 py-1">Actual</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => {
            const a = before[f];
            const b = after[f];
            const changed = a !== b;
            return (
              <tr key={f} className={changed ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}>
                <td className="py-1 align-top capitalize">{String(f).replace('_', ' ')}</td>
                <td className="py-1 align-top">{a}</td>
                <td className={`py-1 align-top ${changed ? 'font-semibold text-amber-700 dark:text-amber-300' : ''}`}>
                  {b}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
