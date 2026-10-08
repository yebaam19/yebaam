'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/Button';
import { imageUrl } from '@/lib/media/urls';
import { safeExternalHref } from '@/lib/safe-href';
import { ArrowTopRightOnSquareIcon, LinkIcon } from '@/components/icons/heroicons-shim';
import { archiveCommunityRelatedLink, loadCommunityRelatedLinks } from '../../actions/relatedLinks.actions';
import type { CommunityRelatedLink, RelatedLinkPage } from '../../types/communityRelatedLink.types';
import { PlanInteractionProvider } from '../plans/PlanInteractionProvider';
import { RelatedLinkForm } from './RelatedLinkForm';

export function RelatedLinksWorkspace(props: {
  communityId: string; slug: string; website: string | null; canManage: boolean; initial: RelatedLinkPage;
}) {
  return <PlanInteractionProvider><RelatedLinks {...props} /></PlanInteractionProvider>;
}

function RelatedLinks({ communityId, slug, website, canManage, initial }: {
  communityId: string; slug: string; website: string | null; canManage: boolean; initial: RelatedLinkPage;
}) {
  const router = useRouter();
  const [page, setPage] = useState(initial);
  const [editing, setEditing] = useState<CommunityRelatedLink | null | 'new'>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const archiveCancel = useRef<HTMLButtonElement>(null);
  const archiveButtons = useRef(new Map<string, HTMLElement>());
  useEffect(() => { if (confirmId) archiveCancel.current?.focus(); }, [confirmId]);

  async function refreshPage() {
    const result = await loadCommunityRelatedLinks({ communityId, cursor: null });
    if (result.ok) setPage(result.data);
    else setError(result.error);
    router.refresh();
  }

  function loadMore() {
    if (!page.nextCursor || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await loadCommunityRelatedLinks({ communityId, cursor: page.nextCursor });
      if (!result.ok) { setError(result.error); return; }
      setPage((current) => ({
        items: [...new Map([...current.items, ...result.data.items].map((item) => [item.id, item])).values()],
        nextCursor: result.data.nextCursor,
      }));
    });
  }

  function archive(item: CommunityRelatedLink) {
    setError(null); setStatus(null);
    startTransition(async () => {
      const result = await archiveCommunityRelatedLink({ communityId, id: item.id, expectedVersion: item.version });
      if (!result.ok) { setError(result.error); return; }
      setConfirmId(null); setStatus('Enlace retirado.');
      await refreshPage(); heading.current?.focus();
    });
  }

  const officialHref = safeExternalHref(website);
  return <section className="space-y-5 rounded-xl bg-white p-4 text-neutral-900 sm:p-5 dark:bg-neutral-800 dark:text-white">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 ref={heading} tabIndex={-1} className="text-xl font-semibold focus:outline-none">Páginas relacionadas</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Organizaciones, filiales y proyectos vinculados.</p></div>
      {canManage && editing === null && <Button color="brand" onClick={() => { setEditing('new'); setError(null); }}>Agregar página</Button>}
    </header>

    {editing !== null && <RelatedLinkForm key={editing === 'new' ? 'new' : editing.id} communityId={communityId} slug={slug}
      initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)}
      onSaved={async (message) => { setStatus(message); setEditing(null); await refreshPage(); heading.current?.focus(); }} />}

    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    {status && <p role="status" className="text-sm text-primary-800 dark:text-primary-300">{status}</p>}
    {officialHref && <a href={officialHref} target="_blank" rel="noopener noreferrer"
      className="block rounded-lg bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
      Sitio web oficial · {website}
    </a>}

    {!page.items.length && !officialHref && <p className="py-7 text-center text-sm text-neutral-600 dark:text-neutral-300">
      {canManage ? 'Todavía no hay páginas vinculadas. Agrega la primera.' : 'Esta comunidad aún no ha publicado páginas relacionadas.'}
    </p>}
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">{page.items.map((item) => {
      const href = safeExternalHref(item.href);
      return <li key={item.id} className="flex min-w-0 items-start gap-3 py-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-50 text-primary-800 sm:h-24 sm:w-28 dark:bg-primary-900/30 dark:text-primary-300">
          {item.image ? <Image src={imageUrl(item.image.media_id)} alt="" fill sizes="112px" className="object-cover" unoptimized />
            : <LinkIcon aria-hidden="true" className="size-6" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="wrap-anywhere text-sm font-semibold">{item.title}</h2>
            {!item.is_published && <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-900 dark:bg-primary-900/30 dark:text-secondary-300">Borrador</span>}
          </div>
          {item.description && <p className="wrap-anywhere text-sm text-neutral-600 dark:text-neutral-300">{item.description}</p>}
          {href && <a href={href} target="_blank" rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-primary-800 underline-offset-4 hover:underline focus-visible:outline-2 dark:text-primary-300">Visitar página <ArrowTopRightOnSquareIcon className="size-4" /></a>}
          {canManage && <div className="flex flex-wrap gap-2 pt-1">
            <Button outline disabled={pending || editing !== null} onClick={() => { setEditing(item); setError(null); }}>Editar</Button>
            <Button ref={(element) => { if (element) archiveButtons.current.set(item.id, element); else archiveButtons.current.delete(item.id); }}
              plain disabled={pending || editing !== null} onClick={() => { setConfirmId(item.id); setError(null); }}>Retirar</Button>
          </div>}
          {confirmId === item.id && <div role="group" aria-label={`Retirar ${item.title}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
            <p className="mr-auto text-sm text-red-900 dark:text-red-200">¿Retirar este enlace de la comunidad?</p>
            <Button ref={archiveCancel} outline disabled={pending} onClick={() => { setConfirmId(null); requestAnimationFrame(() => archiveButtons.current.get(item.id)?.focus()); }}>Cancelar</Button>
            <Button color="red" disabled={pending} onClick={() => archive(item)}>Confirmar retiro</Button>
          </div>}
        </div>
      </li>;
    })}</ul>
    {page.nextCursor && <Button outline disabled={pending} onClick={loadMore}>{pending ? 'Cargando…' : 'Ver más páginas'}</Button>}
  </section>;
}
