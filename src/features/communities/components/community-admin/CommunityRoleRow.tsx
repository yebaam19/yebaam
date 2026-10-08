'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/ui/Button';
import { revokeCommunityRole, saveCommunityRole } from '../../actions/communityRoles.actions';
import type { CommunityRole, CommunityRoleGrant } from '../../types/communityRole.types';

export function CommunityRoleRow({ communityId, grant, onChanged }: {
  communityId: string; grant: CommunityRoleGrant; onChanged: (message: string, revokedUserId?: string) => Promise<void>;
}) {
  const [role, setRole] = useState<CommunityRole>(grant.role);
  const [canEditPlans, setCanEditPlans] = useState(grant.canEditPlans);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const revokeRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirm) cancelRef.current?.focus(); }, [confirm]);
  const name = grant.username ? `@${grant.username}` : grant.displayName;
  const changed = role !== grant.role || (role === 'editor' && canEditPlans !== grant.canEditPlans);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveCommunityRole({ communityId, userId: grant.userId, role, canEditPlans });
      if (!result.ok) { setError(result.error); return; }
      await onChanged(`Permisos de ${name} actualizados.`);
    });
  }
  function revoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeCommunityRole({ communityId, userId: grant.userId });
      if (!result.ok) { setError(result.error); return; }
      await onChanged(`Rol de ${name} revocado.`, grant.userId);
    });
  }

  return <li className="space-y-3 py-4">
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{grant.displayName}</p>
      {grant.username && <p className="truncate text-xs text-neutral-600 dark:text-neutral-300">@{grant.username}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-200">Rol de {name}
        <select value={role} disabled={pending} onChange={(event) => { setRole(event.target.value as CommunityRole); setCanEditPlans(false); }}
          className="ml-2 min-h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white">
          <option value="admin">Administrador</option><option value="editor">Editor</option><option value="moderator">Moderador</option>
        </select>
      </label>
      {role === 'editor' && <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-200">
        <input type="checkbox" checked={canEditPlans} disabled={pending} onChange={(event) => setCanEditPlans(event.target.checked)} className="size-4 accent-primary-800" />
        Edita planes
      </label>}
      <Button outline disabled={pending || !changed || confirm} onClick={save}>Guardar</Button>
      <Button ref={revokeRef} plain disabled={pending || confirm} onClick={() => setConfirm(true)}>Revocar</Button>
    </div>
    {confirm && <div role="group" aria-label={`Confirmar revocación de ${name}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950/30">
      <p className="mr-auto text-red-900 dark:text-red-200">¿Revocar los permisos de {name}?</p>
      <Button ref={cancelRef} outline disabled={pending} onClick={() => { setConfirm(false); revokeRef.current?.focus(); }}>Cancelar</Button>
      <Button color="red" disabled={pending} onClick={revoke}>Confirmar revocación</Button>
    </div>}
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </li>;
}
