'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EllipsisVerticalIcon } from '@/components/icons/heroicons-shim';
import { removeMember, updateMemberRole } from '../actions/families.actions';
import type { FamilyMemberRole } from '../types/family.types';

interface Props {
  familyId: string;
  member: { profile_id: string; role: FamilyMemberRole };
  memberLabel: string;
}

export function MemberActionsMenu({ familyId, member, memberLabel }: Props) {
  const router = useRouter();
  const t = useTranslations('familias.memberActions');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (member.role === 'owner') return null;

  function close() {
    setOpen(false);
  }

  function changeRole(newRole: 'admin' | 'member') {
    setError(null);
    setOpen(false);
    startTransition(async () => {
      const res = await updateMemberRole({
        familyId,
        profileId: member.profile_id,
        role: newRole,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function kick() {
    setError(null);
    setOpen(false);
    if (!window.confirm(`¿Expulsar a ${memberLabel} de la familia? Pierde el acceso al contenido.`)) {
      return;
    }
    startTransition(async () => {
      const res = await removeMember({ familyId, profileId: member.profile_id });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label={t('menuAria')}
        title="Acciones"
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {member.role === 'member' ? (
            <button
              type="button"
              onClick={() => changeRole('admin')}
              className="flex w-full items-center px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Promover a admin
            </button>
          ) : (
            <button
              type="button"
              onClick={() => changeRole('member')}
              className="flex w-full items-center px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Quitar admin
            </button>
          )}
          <button
            type="button"
            onClick={kick}
            className="flex w-full items-center border-t border-zinc-200 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:border-zinc-800 dark:text-rose-400 dark:hover:bg-rose-900/20"
          >
            Expulsar de la familia
          </button>
        </div>
      )}
      {error && (
        <p className="absolute right-0 top-full z-20 mt-1 rounded bg-rose-600 px-2 py-1 text-[10px] text-white shadow">
          {error}
        </p>
      )}
    </div>
  );
}
