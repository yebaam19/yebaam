'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LinkIcon } from '@/components/icons/heroicons-shim';
import { linkRelationship } from '../actions/families.actions';
import type { FamilyPersonRow, FamilyRelationshipKind } from '../types/family.types';

interface Props {
  familyId: string;
  persons: FamilyPersonRow[];
}

const KIND_OPTIONS: Array<{ value: FamilyRelationshipKind; label: string; help: string }> = [
  { value: 'parent', label: 'Padre/Madre → Hijo/a', help: 'A es padre/madre de B (direccional).' },
  { value: 'spouse', label: 'Cónyuges', help: 'A y B están casados (no direccional).' },
  { value: 'sibling', label: 'Hermanos', help: 'A y B son hermanos (no direccional).' },
];

export function LinkRelationshipDialog({ familyId, persons }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FamilyRelationshipKind>('parent');
  const [personA, setPersonA] = useState<string>('');
  const [personB, setPersonB] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setKind('parent');
    setPersonA('');
    setPersonB('');
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!personA || !personB) {
      setError('Selecciona dos personas distintas.');
      return;
    }
    if (personA === personB) {
      setError('Las dos personas deben ser distintas.');
      return;
    }
    startTransition(async () => {
      const res = await linkRelationship({
        familyId,
        personId: personA,
        relatedPersonId: personB,
        type: kind,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  if (persons.length < 2) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
      >
        <LinkIcon className="h-4 w-4" />
        Conectar relación
      </button>
    );
  }

  const labelA =
    kind === 'parent' ? 'Padre o madre' : kind === 'spouse' ? 'Persona A' : 'Hermano A';
  const labelB =
    kind === 'parent' ? 'Hijo/a' : kind === 'spouse' ? 'Persona B' : 'Hermano B';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Conectar dos personas
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Tipo de relación
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as FamilyRelationshipKind)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-zinc-500">
              {KIND_OPTIONS.find((o) => o.value === kind)?.help}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {labelA}
            </label>
            <select
              value={personA}
              onChange={(e) => setPersonA(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Selecciona…</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {labelB}
            </label>
            <select
              value={personB}
              onChange={(e) => setPersonB(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Selecciona…</option>
              {persons
                .filter((p) => p.id !== personA)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || !personA || !personB}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? 'Guardando…' : 'Conectar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
