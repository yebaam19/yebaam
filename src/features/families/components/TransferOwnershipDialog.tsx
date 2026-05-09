'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { transferFamilyOwnership } from '../actions/families.actions';
import type { FamilyMemberListItem } from './FamilyMembersList';

interface Props {
  familyId: string;
  members: FamilyMemberListItem[];
  currentOwnerId: string;
}

export function TransferOwnershipDialog({ familyId, members, currentOwnerId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const eligibleMembers = members.filter((m) => m.profile_id !== currentOwnerId);

  function close() {
    setOpen(false);
    setNewOwnerId('');
    setConfirmText('');
    setError(null);
  }

  function onTransfer() {
    if (!newOwnerId) {
      setError('Selecciona un nuevo dueño.');
      return;
    }
    if (confirmText !== 'TRANSFERIR') {
      setError('Escribe TRANSFERIR para confirmar.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await transferFamilyOwnership({
        familyId,
        newOwnerProfileId: newOwnerId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  if (eligibleMembers.length === 0) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
        Para transferir la propiedad necesitas otro miembro en la familia. Invita a alguien primero.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-300 dark:hover:bg-amber-900/20"
      >
        Transferir propiedad
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Transferir propiedad de la familia
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Después de transferir, tu rol pasa a <span className="font-semibold">admin</span> y el nuevo dueño asume control total (incluyendo poder eliminar la familia o expulsarte).
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nuevo dueño
            </label>
            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Selecciona…</option>
              {eligibleMembers.map((m) => {
                const fullName =
                  [m.profile.firstName, m.profile.lastName].filter(Boolean).join(' ') ||
                  m.profile.username ||
                  '(sin nombre)';
                return (
                  <option key={m.profile_id} value={m.profile_id}>
                    {fullName} (@{m.profile.username})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Para confirmar, escribe <span className="font-mono">TRANSFERIR</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
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
              type="button"
              onClick={onTransfer}
              disabled={pending || !newOwnerId || confirmText !== 'TRANSFERIR'}
              className="inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {pending ? 'Transfiriendo…' : 'Transferir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
