'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/Button';
import { getMoreCommunityRoles, saveCommunityRole } from '../../actions/communityRoles.actions';
import type { CommunityRole, CommunityRolePage } from '../../types/communityRole.types';
import { CommunityRoleRow } from './CommunityRoleRow';

const fieldClass = 'min-h-11 w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:focus-visible:outline-primary-300';

export function CommunityRoleManager({ communityId, initial }: { communityId: string; initial: CommunityRolePage }) {
  const router = useRouter();
  const [page, setPage] = useState(initial);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<CommunityRole>('editor');
  const [canEditPlans, setCanEditPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  async function refreshRoles() {
    const result = await getMoreCommunityRoles({ communityId, cursor: null });
    if (result.ok) setPage(result.data);
    else setError(result.error);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null); setStatus(null);
    startTransition(async () => {
      const result = await saveCommunityRole({ communityId, username, role, canEditPlans });
      if (!result.ok) { setError(result.error); return; }
      setUsername(''); setCanEditPlans(false);
      setStatus('Rol guardado. El permiso ya está activo.');
      await refreshRoles();
      router.refresh();
    });
  }

  function handleLoadMore() {
    if (!page.nextCursor || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await getMoreCommunityRoles({ communityId, cursor: page.nextCursor });
      if (!result.ok) { setError(result.error); return; }
      setPage((current) => ({
        items: [...new Map([...current.items, ...result.data.items].map((item) => [item.userId, item])).values()],
        nextCursor: result.data.nextCursor,
      }));
    });
  }

  async function onChanged(message: string, revokedUserId?: string) {
    if (revokedUserId) setPage((current) => ({ ...current, items: current.items.filter((item) => item.userId !== revokedUserId) }));
    setStatus(message);
    headingRef.current?.focus();
    if (!revokedUserId) await refreshRoles();
    router.refresh();
  }

  return <section aria-labelledby="community-roles-title" className="my-6 space-y-4 border-t border-neutral-200 pt-5 dark:border-neutral-700">
    <div>
      <h3 id="community-roles-title" ref={headingRef} tabIndex={-1} className="text-base font-semibold text-neutral-900 focus:outline-none dark:text-white">Roles del perfil</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Asigna permisos solo a miembros activos. Al salir de la comunidad, el permiso se revoca.</p>
    </div>
    <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
      <label className="block min-w-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">Usuario
        <input className={`${fieldClass} mt-1`} value={username} onChange={(event) => setUsername(event.target.value)}
          placeholder="@usuario miembro" autoComplete="off" required />
      </label>
      <label className="block min-w-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">Rol
        <select className={`${fieldClass} mt-1`} value={role} onChange={(event) => { setRole(event.target.value as CommunityRole); setCanEditPlans(false); }}>
          <option value="admin">Administrador</option><option value="editor">Editor</option><option value="moderator">Moderador</option>
        </select>
      </label>
      <Button type="submit" color="brand" disabled={pending || !username.trim()}>Asignar rol</Button>
      {role === 'editor' && <label className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-3 dark:text-neutral-200">
        <input type="checkbox" checked={canEditPlans} onChange={(event) => setCanEditPlans(event.target.checked)} className="size-4 accent-primary-800" />
        También puede editar los planes
      </label>}
    </form>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    {status && <p role="status" className="text-sm text-primary-800 dark:text-primary-300">{status}</p>}
    {page.items.length === 0 ? <p className="text-sm text-neutral-600 dark:text-neutral-300">Todavía no hay permisos delegados.</p>
      : <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">{page.items.map((grant) =>
        <CommunityRoleRow key={`${grant.userId}:${grant.role}:${grant.canEditPlans}`} communityId={communityId} grant={grant} onChanged={onChanged} />)}</ul>}
    {page.nextCursor && <Button outline disabled={pending} onClick={handleLoadMore}>{pending ? 'Cargando…' : 'Ver más roles'}</Button>}
  </section>;
}
