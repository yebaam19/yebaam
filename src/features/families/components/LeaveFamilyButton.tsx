'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { leaveFamily } from '../actions/families.actions';

export function LeaveFamilyButton({ familyId, familyName }: { familyId: string; familyName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onLeave() {
    setError(null);
    startTransition(async () => {
      const res = await leaveFamily(familyId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push('/feed/familias');
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-900/20"
      >
        Abandonar familia
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-900/20">
      <p className="text-sm text-rose-800 dark:text-rose-200">
        ¿Seguro que quieres salir de <span className="font-semibold">{familyName}</span>? Perderás
        acceso al árbol y al contenido. Si te invitan de nuevo podrás volver.
      </p>
      {error && (
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">{error}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onLeave}
          disabled={pending}
          className="inline-flex items-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {pending ? 'Saliendo…' : 'Sí, salir'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
