'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { unlinkRelationship } from '../actions/families.actions';
import type { FamilyPersonRow, FamilyRelationshipKind } from '../types/family.types';

export interface SelectedEdge {
  id: string;
  kind: FamilyRelationshipKind;
  source: FamilyPersonRow;
  target: FamilyPersonRow;
}

interface Props {
  selected: SelectedEdge | null;
  onClose: () => void;
}

const KIND_LABEL: Record<FamilyRelationshipKind, string> = {
  parent: 'Padre/madre → Hijo/a',
  spouse: 'Cónyuges',
  sibling: 'Hermanos',
};

export function EditEdgeDialog({ selected, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!selected) return null;

  const arrow = selected.kind === 'parent' ? '→' : '↔';

  function handleDelete() {
    if (!selected) return;
    setError(null);
    if (
      !window.confirm(
        `¿Eliminar la relación "${selected.source.full_name} ${arrow} ${selected.target.full_name}"? La acción se puede deshacer creándola otra vez.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await unlinkRelationship(selected.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Relación
        </h3>
        <p className="mt-1 text-xs text-zinc-500">{KIND_LABEL[selected.kind]}</p>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {selected.source.full_name}
          </p>
          <p className="my-1 text-center text-xs text-zinc-500" aria-hidden>
            {arrow}
          </p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {selected.target.full_name}
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-900/20"
          >
            {pending ? 'Eliminando…' : 'Eliminar relación'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
