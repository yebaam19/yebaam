'use client';

import { useState, useTransition } from 'react';
import { moveClubMember } from '../../../actions/club-roles.actions';

interface ClubOption {
  id: string;
  name: string;
}

interface Props {
  member: { user_id: string; club_id: string; club_name: string; display_name: string };
  clubs: ClubOption[];
  onClose: () => void;
  onMoved: (toClubId: string) => void;
}

export function MoveMemberDialog({ member, clubs, onClose, onMoved }: Props) {
  const targets = clubs.filter((c) => c.id !== member.club_id);
  const [targetId, setTargetId] = useState<string>(targets[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await moveClubMember(member.club_id, targetId, member.user_id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onMoved(targetId);
      onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Mover miembro entre clubes
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Mover a <strong>{member.display_name}</strong> desde{' '}
            <strong>{member.club_name}</strong> a otro club. Quedará como MEMBER aprobado en el
            destino.
          </p>
        </header>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Club destino
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {targets.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !targetId}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-40"
          >
            {pending ? 'Moviendo…' : 'Mover'}
          </button>
        </div>
      </div>
    </div>
  );
}
