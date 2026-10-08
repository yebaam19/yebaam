'use client';

import { useRef, useState, useTransition } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Input from '@/ui/Input';
import { Button } from '@/ui/Button';
import { loadLibraryAssets } from '../../actions/library/queries.actions';
import { useLibraryPage } from '../../hooks/useLibraryPage';
import type { AssetKind, LibraryAsset, LibraryPage, FolderPage } from '../../types/communityLibrary.types';
import { LibraryFolderSelect } from './LibraryFolderSelect';
import { LibraryAssetView } from './LibraryAssetView';
import { LibraryAssetForm } from './LibraryAssetForm';
import { LibraryFolderManager } from './LibraryFolderManager';
import { LibraryDeleteAsset } from './LibraryDeleteAsset';
import { LibraryUploadPanel } from './LibraryUploadPanel';

type Editor = { type: 'edit' | 'replace' | 'delete'; asset: LibraryAsset } | { type: 'upload' | 'folders' };

export interface LibraryWorkspaceProps {
  communityId: string; kind: AssetKind; initial: LibraryPage; folders: FolderPage;
  canEdit: boolean; basePath: string; search: string; folderId?: string | null; pdfOnly?: boolean;
}

export function LibraryWorkspace({ communityId, kind, initial, folders, canEdit, basePath, search, folderId, pdfOnly = false }: LibraryWorkspaceProps) {
  const t = useTranslations('communities.library');
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const [editor, setEditor] = useState<Editor | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const page = useLibraryPage(initial, (cursor) => loadLibraryAssets({ communityId, kind, folderId, search, cursor, pdfOnly }));
  const blocked = editor !== null || navigating;
  function edit(value: Editor) {
    origin.current = document.activeElement as HTMLElement | null;
    setEditor(value);
    requestAnimationFrame(() => { panel.current?.scrollIntoView({ block: 'nearest' }); panel.current?.focus(); });
  }
  function close() { setEditor(null); requestAnimationFrame(() => origin.current?.focus()); }
  function filter(form: FormData) {
    if (blocked) return;
    const query = new URLSearchParams();
    const term = String(form.get('search') ?? '').trim();
    const folder = String(form.get('folderId') ?? 'all');
    if (term) query.set('q', term);
    if (folder !== 'all') query.set('carpeta', folder);
    startNavigation(() => router.push(`${basePath}${query.size ? `?${query}` : ''}` as Route));
  }
  return <section aria-label={t(pdfOnly ? 'titles.pdf' : `titles.${kind}`)} className="rounded-xl bg-white p-4 text-gray-900 sm:p-5 dark:bg-gray-800 dark:text-white">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">{t(pdfOnly ? 'titles.pdf' : `titles.${kind}`)}</h2>
      {canEdit && <div className="flex flex-wrap gap-2">
        <Button outline disabled={blocked} onClick={() => edit({ type: 'folders' })}>{t('manageFolders')}</Button>
        <Button color="blue" disabled={blocked} onClick={() => edit({ type: 'upload' })}>{t('upload')}</Button>
      </div>}
    </header>
    {editor && <div ref={panel} tabIndex={-1} className="mb-5 rounded-xl border border-gray-300 p-4 focus:outline-none dark:border-gray-600">
      {editor.type === 'edit' && <LibraryAssetForm asset={editor.asset} folders={folders} onClose={close} />}
      {editor.type === 'delete' && <LibraryDeleteAsset asset={editor.asset} onClose={close} />}
      {editor.type === 'folders' && <LibraryFolderManager communityId={communityId} kind={kind} initial={folders} onClose={close} />}
      {(editor.type === 'upload' || editor.type === 'replace') && <LibraryUploadPanel communityId={communityId} kind={kind} pdfOnly={pdfOnly}
        replacement={editor.type === 'replace' ? editor.asset : undefined} onClose={close} />}
    </div>}
    <form role="search" aria-label={t('searchLibrary')} onSubmit={(event) => { event.preventDefault(); filter(new FormData(event.currentTarget)); }} className="mb-5">
      <fieldset disabled={blocked} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="col-span-2 block min-w-0 text-sm font-medium sm:col-span-1">{t('search')}<Input type="search" name="search" defaultValue={search} placeholder={t('searchPlaceholder')} maxLength={100} className="mt-1.5" /></label>
        <LibraryFolderSelect communityId={communityId} kind={kind} initial={folders} value={folderId === null ? 'none' : folderId} includeAll disabled={blocked} />
        <Button type="submit" outline disabled={blocked}>{t(navigating ? 'loading' : 'search')}</Button>
      </fieldset>
    </form>
    <div aria-busy={navigating || page.pending} className={kind === 'document' ? '' : 'grid gap-x-5 gap-y-6 sm:grid-cols-2 2xl:grid-cols-3'}>
      {page.items.map((asset) => <LibraryAssetView key={asset.id} asset={asset} canEdit={canEdit}>
        {canEdit && <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-gray-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-gray-300" aria-label={t('manageNamed', { title: asset.title })}>{t('manage')}</summary>
          <div className="flex flex-wrap gap-1">
            <Button plain disabled={blocked} onClick={() => edit({ type: 'edit', asset })}>{t('edit')}</Button>
            <Button plain disabled={blocked} onClick={() => edit({ type: 'replace', asset })}>{t('replace')}</Button>
            <Button plain disabled={blocked} onClick={() => edit({ type: 'delete', asset })}>{t('delete')}</Button>
          </div>
        </details>}
      </LibraryAssetView>)}
    </div>
    {!page.items.length && <div className="py-8 text-center">
      <p className="text-sm font-medium">{t(search || folderId !== undefined ? 'noResults' : 'empty')}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">{t(search || folderId !== undefined ? 'noResultsHint' : canEdit ? 'emptyEditorHint' : 'emptyReaderHint')}</p>
    </div>}
    {page.error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">{page.error}</p>}
    {page.nextCursor && <div className="mt-5"><Button outline disabled={blocked || page.pending} onClick={page.loadMore}>{t(page.pending ? 'loading' : 'loadMore')}</Button></div>}
  </section>;
}
