'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteFamily } from '../actions/families.actions';

export function DeleteFamilyButton({
  familyId,
  familyName,
}: {
  familyId: string;
  familyName: string;
}) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (confirmText !== familyName) {
      setError(`Escribe "${familyName}" exactamente para confirmar.`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteFamily(familyId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push('/feed/familias');
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
      <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">Eliminar familia</h3>
      <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
        Esto borra <span className="font-semibold">todo</span>: árbol, fotos, historias, eventos, documentos y miembros.
        No se puede deshacer.
      </p>
      <label className="mt-3 block text-xs font-medium text-rose-800 dark:text-rose-200">
        Para confirmar, escribe el nombre exacto: <span className="font-mono">{familyName}</span>
      </label>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="mt-1 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-rose-800 dark:bg-zinc-900 dark:text-zinc-100"
        placeholder={familyName}
      />
      {error && <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">{error}</p>}
      <button
        type="button"
        onClick={onDelete}
        disabled={pending || confirmText !== familyName}
        className="mt-3 inline-flex items-center rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
      >
        {pending ? 'Eliminando…' : 'Eliminar familia para siempre'}
      </button>
    </div>
  );
}
