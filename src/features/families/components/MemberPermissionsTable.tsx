'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  resetMemberPermissions,
  setMemberPermissions,
} from '../actions/families.actions';
import type {
  FamilyMemberPermissionsRow,
  MemberViewKey,
} from '../types/family.types';
import type { FamilyMemberListItem } from './FamilyMembersList';

const COLUMNS: Array<{ key: MemberViewKey; label: string; dtoKey: keyof NonNullable<Parameters<typeof setMemberPermissions>[0]['perms']> }> = [
  { key: 'can_view_persons',   label: 'Personas',  dtoKey: 'canViewPersons' },
  { key: 'can_view_events',    label: 'Eventos',   dtoKey: 'canViewEvents' },
  { key: 'can_view_photos',    label: 'Fotos',     dtoKey: 'canViewPhotos' },
  { key: 'can_view_stories',   label: 'Historias', dtoKey: 'canViewStories' },
  { key: 'can_view_documents', label: 'Documentos', dtoKey: 'canViewDocuments' },
];

interface Props {
  familyId: string;
  members: FamilyMemberListItem[];
  permissions: FamilyMemberPermissionsRow[];
}

export function MemberPermissionsTable({ familyId, members, permissions }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mostrar solo miembros que NO son owner. Owner siempre ve todo.
  const eligible = members.filter((m) => m.role !== 'owner');
  const permsByProfile = new Map(permissions.map((p) => [p.profile_id, p]));

  if (eligible.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        Cuando agregues miembros podrás restringir qué ven aquí.
      </div>
    );
  }

  function handleToggle(profileId: string, col: typeof COLUMNS[number], next: boolean) {
    const key = `${profileId}:${col.key}`;
    setBusyKey(key);
    setError(null);
    startTransition(async () => {
      const res = await setMemberPermissions({
        familyId,
        profileId,
        perms: { [col.dtoKey]: next },
      });
      if (!res.ok) setError(res.error);
      setBusyKey(null);
      router.refresh();
    });
  }

  function handleReset(profileId: string) {
    setBusyKey(`${profileId}:reset`);
    setError(null);
    startTransition(async () => {
      const res = await resetMemberPermissions({ familyId, profileId });
      if (!res.ok) setError(res.error);
      setBusyKey(null);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Miembro</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-3 py-2 text-center font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Reset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {eligible.map((m) => {
              const fullName =
                [m.profile.firstName, m.profile.lastName].filter(Boolean).join(' ') ||
                m.profile.username ||
                '(sin nombre)';
              const override = permsByProfile.get(m.profile_id);
              const hasOverride = Boolean(override);
              return (
                <tr key={m.profile_id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{fullName}</p>
                    <p className="truncate text-[10px] text-zinc-500">@{m.profile.username}</p>
                  </td>
                  {COLUMNS.map((col) => {
                    const value = override ? override[col.key] : true;
                    const key = `${m.profile_id}:${col.key}`;
                    return (
                      <td key={col.key} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={value}
                          disabled={pending}
                          onChange={(e) => handleToggle(m.profile_id, col, e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          title={value ? `Puede ver ${col.label.toLowerCase()}` : `No puede ver ${col.label.toLowerCase()}`}
                        />
                        {pending && busyKey === key && (
                          <span className="ml-1 text-[9px] text-zinc-500">…</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    {hasOverride ? (
                      <button
                        type="button"
                        onClick={() => handleReset(m.profile_id)}
                        disabled={pending}
                        className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Quitar override
                      </button>
                    ) : (
                      <span className="text-[10px] text-zinc-400">Sin override</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        Nota: si quitas "Fotos" a un miembro, tampoco verá fotos en la línea de tiempo. Owners ven todo siempre.
      </p>
      {error && (
        <div className="border-t border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
