'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateFamily } from '../actions/families.actions';
import type { FamilyWithViewer } from '../types/family.types';

interface ToggleDef {
  field: keyof Pick<
    FamilyWithViewer,
    | 'member_can_invite'
    | 'member_can_add_persons'
    | 'member_can_add_events'
    | 'member_can_add_photos'
    | 'member_can_add_stories'
    | 'member_can_add_documents'
  >;
  label: string;
  hint: string;
  dtoKey:
    | 'memberCanInvite'
    | 'memberCanAddPersons'
    | 'memberCanAddEvents'
    | 'memberCanAddPhotos'
    | 'memberCanAddStories'
    | 'memberCanAddDocuments';
}

const TOGGLES: ToggleDef[] = [
  { field: 'member_can_invite', dtoKey: 'memberCanInvite', label: 'Invitar familiares', hint: 'Los miembros pueden invitar a otros @username.' },
  { field: 'member_can_add_persons', dtoKey: 'memberCanAddPersons', label: 'Agregar personas al árbol', hint: 'Los miembros pueden añadir nuevos familiares (vivos o fallecidos).' },
  { field: 'member_can_add_events', dtoKey: 'memberCanAddEvents', label: 'Agregar eventos', hint: 'Bodas, nacimientos, defunciones en la línea de tiempo.' },
  { field: 'member_can_add_photos', dtoKey: 'memberCanAddPhotos', label: 'Subir fotos', hint: 'Galería familiar (Cloudflare Images).' },
  { field: 'member_can_add_stories', dtoKey: 'memberCanAddStories', label: 'Escribir historias', hint: 'Anécdotas y recuerdos.' },
  { field: 'member_can_add_documents', dtoKey: 'memberCanAddDocuments', label: 'Subir documentos', hint: 'Actas, cartas, identificaciones.' },
];

export function FamilyToggleSettings({ family }: { family: FamilyWithViewer }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);

  function handleToggle(t: ToggleDef, next: boolean) {
    setError(null);
    setSavingField(t.field);
    startTransition(async () => {
      const res = await updateFamily({ id: family.id, [t.dtoKey]: next });
      if (!res.ok) setError(res.error);
      setSavingField(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Estos toggles aplican <span className="font-semibold">solo a miembros</span>. Owners y admins siempre pueden todo.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TOGGLES.map((t) => {
          const value = family[t.field];
          const isSaving = pending && savingField === t.field;
          return (
            <label
              key={t.field}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <input
                type="checkbox"
                checked={value}
                disabled={pending}
                onChange={(e) => handleToggle(t, e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {t.label}
                  {isSaving && <span className="ml-2 text-xs font-normal text-zinc-500">guardando…</span>}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{t.hint}</p>
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
