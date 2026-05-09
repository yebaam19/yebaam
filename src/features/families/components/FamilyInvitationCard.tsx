'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptFamilyInvitation, declineFamilyInvitation } from '../actions/families.actions';

export interface FamilyInvitationViewModel {
  id: string;
  familyName: string;
  familySlug: string;
  inviterName: string;
  createdAt: string;
}

export function FamilyInvitationCard({ invite }: { invite: FamilyInvitationViewModel }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null);

  function onAccept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptFamilyInvitation(invite.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone('accepted');
      router.push(`/feed/familias/${invite.familySlug}`);
      router.refresh();
    });
  }

  function onDecline() {
    setError(null);
    startTransition(async () => {
      const res = await declineFamilyInvitation(invite.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone('declined');
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        {done === 'accepted'
          ? `Te uniste a "${invite.familyName}".`
          : `Rechazaste la invitación a "${invite.familyName}".`}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-900/20">
      <p className="text-sm text-zinc-700 dark:text-zinc-200">
        <span className="font-semibold">{invite.inviterName}</span> te invitó a{' '}
        <span className="font-semibold">{invite.familyName}</span>.
      </p>
      {error && (
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">{error}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onAccept}
          disabled={pending}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Aceptar
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={pending}
          className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
