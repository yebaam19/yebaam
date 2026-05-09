'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addFamilyParents } from '../actions/families.actions';
import type {
  FamilyGender,
  FamilyPersonRow,
  ParentInputData,
} from '../types/family.types';

interface Props {
  familyId: string;
  child: FamilyPersonRow | null;
  existingPersons: FamilyPersonRow[];
  onClose: () => void;
}

interface ParentFormState {
  enabled: boolean;
  useExisting: boolean;
  existingId: string;
  fullName: string;
  birthDate: string;
  deathDate: string;
}

const EMPTY_PARENT: ParentFormState = {
  enabled: true,
  useExisting: false,
  existingId: '',
  fullName: '',
  birthDate: '',
  deathDate: '',
};

export function AddParentsDialog({ familyId, child, existingPersons, onClose }: Props) {
  const router = useRouter();
  const [father, setFather] = useState<ParentFormState>({ ...EMPTY_PARENT });
  const [mother, setMother] = useState<ParentFormState>({ ...EMPTY_PARENT });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!child) return;
    setFather({ ...EMPTY_PARENT });
    setMother({ ...EMPTY_PARENT });
    setError(null);
  }, [child?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!child) return null;

  const eligible = existingPersons.filter((p) => p.id !== child.id);

  function buildParentInput(form: ParentFormState, defaultGender: FamilyGender): ParentInputData | undefined {
    if (!form.enabled || form.useExisting) return undefined;
    if (!form.fullName.trim()) return undefined;
    return {
      fullName: form.fullName.trim(),
      gender: defaultGender,
      birthDate: form.birthDate || undefined,
      deathDate: form.deathDate || undefined,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!child) return;
    setError(null);

    const fatherIsActive = father.enabled && (father.useExisting ? father.existingId : father.fullName.trim());
    const motherIsActive = mother.enabled && (mother.useExisting ? mother.existingId : mother.fullName.trim());
    if (!fatherIsActive && !motherIsActive) {
      setError('Activa y completa al menos uno (padre o madre).');
      return;
    }

    startTransition(async () => {
      const res = await addFamilyParents({
        familyId,
        childId: child.id,
        father: buildParentInput(father, 'male'),
        mother: buildParentInput(mother, 'female'),
        fatherExistingId:
          father.enabled && father.useExisting && father.existingId ? father.existingId : undefined,
        motherExistingId:
          mother.enabled && mother.useExisting && mother.existingId ? mother.existingId : undefined,
      });
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
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Agregar padres a {child.full_name}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Crea nuevas personas o selecciona alguien que ya está en el árbol. Marca al menos un lado.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <ParentSubForm
              title="Padre"
              state={father}
              setState={setFather}
              existingPersons={eligible}
            />
            <ParentSubForm
              title="Madre"
              state={mother}
              setState={setMother}
              existingPersons={eligible}
            />
          </div>

          {error && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {pending ? 'Guardando…' : 'Agregar padres'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ParentSubForm({
  title,
  state,
  setState,
  existingPersons,
}: {
  title: string;
  state: ParentFormState;
  setState: (s: ParentFormState) => void;
  existingPersons: FamilyPersonRow[];
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</h4>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={(e) => setState({ ...state, enabled: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
          />
          Incluir
        </label>
      </div>

      {state.enabled && (
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={state.useExisting}
              onChange={(e) => setState({ ...state, useExisting: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            />
            Usar persona ya en el árbol
          </label>

          {state.useExisting ? (
            <select
              value={state.existingId}
              onChange={(e) => setState({ ...state, existingId: e.target.value })}
              className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Selecciona…</option>
              {existingPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                type="text"
                value={state.fullName}
                onChange={(e) => setState({ ...state, fullName: e.target.value })}
                placeholder="Nombre completo"
                maxLength={160}
                className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={state.birthDate}
                  onChange={(e) => setState({ ...state, birthDate: e.target.value })}
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  title="Nacimiento"
                />
                <input
                  type="date"
                  value={state.deathDate}
                  onChange={(e) => setState({ ...state, deathDate: e.target.value })}
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  title="Defunción"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
