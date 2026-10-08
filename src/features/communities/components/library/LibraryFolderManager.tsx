'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Input from '@/ui/Input';
import { Button } from '@/ui/Button';
import { saveAssetFolder, deleteAssetFolder } from '../../actions/library/content.actions';
import { loadAssetFolders } from '../../actions/library/queries.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { useLibraryPage } from '../../hooks/useLibraryPage';
import type { AssetFolder, AssetKind, FolderPage } from '../../types/communityLibrary.types';
import { PlanFeedback } from '../plans/PlanFeedback';

export function LibraryFolderManager({ communityId, kind, initial, onClose }: {
  communityId: string; kind: AssetKind; initial: FolderPage; onClose: () => void;
}) {
  const t = useTranslations('communities.library');
  const [editing, setEditing] = useState<AssetFolder | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AssetFolder | null>(null);
  const [newId, setNewId] = useState<string>();
  const folders = useLibraryPage(initial, (cursor) => loadAssetFolders({ communityId, kind, cursor }));
  const mutation = usePlanMutation();
  const folder = editing && editing !== 'new' ? editing : null;
  function save(form: FormData) {
    const id = folder?.id ?? newId ?? crypto.randomUUID();
    setNewId(id);
    mutation.run(() => saveAssetFolder({ communityId, kind, id, title: form.get('title'), isVisible: form.get('visible') === 'on', expectedVersion: folder?.version }), onClose);
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">{t('manageFolders')}</h3>
      {!editing && !deleting && <Button type="button" outline onClick={() => setEditing('new')}>{t('newFolder')}</Button>}
    </div>
    {editing ? <form key={folder?.id ?? 'new'} onSubmit={(event) => { event.preventDefault(); save(new FormData(event.currentTarget)); }}>
      <fieldset disabled={mutation.blocked} className="space-y-4">
        <label className="block text-sm font-medium">{t('folderName')}<Input autoFocus name="title" required maxLength={120} defaultValue={folder?.title ?? ''} className="mt-1.5" /></label>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input name="visible" type="checkbox" defaultChecked={folder?.is_visible ?? false} className="rounded" />{t('showFolder')}</label>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('folderHint')}</p>
        <div className="flex flex-wrap gap-2"><Button type="submit" color="blue">{t(mutation.pending ? 'saving' : 'save')}</Button><Button type="button" outline onClick={() => setEditing(null)}>{t('cancel')}</Button></div>
      </fieldset>
    </form> : deleting ? <div className="space-y-3">
      <p className="break-words text-sm">{t('deleteFolderConfirm', { title: deleting.title })}</p>
      <div className="flex flex-wrap gap-2"><Button color="red" disabled={mutation.blocked} onClick={() => mutation.run(() => deleteAssetFolder({ communityId, id: deleting.id, expectedVersion: deleting.version, confirmed: true }), onClose)}>{t('delete')}</Button>
        <Button outline disabled={mutation.pending} onClick={() => setDeleting(null)}>{t('cancel')}</Button></div>
    </div> : <>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {folders.items.map((item) => <li key={item.id} className="flex flex-wrap items-center gap-2 py-2">
          <span className="min-w-0 flex-1 break-words text-sm">{item.title}{!item.is_visible && <span className="text-amber-800 dark:text-amber-300"> · {t('hidden')}</span>}</span>
          <Button plain onClick={() => setEditing(item)} aria-label={t('editNamed', { title: item.title })}>{t('edit')}</Button>
          <Button plain onClick={() => setDeleting(item)} aria-label={t('deleteNamed', { title: item.title })}>{t('delete')}</Button>
        </li>)}
      </ul>
      {!folders.items.length && <p className="text-sm text-gray-600 dark:text-gray-300">{t('emptyFolders')}</p>}
      {folders.nextCursor && <Button outline disabled={folders.pending} onClick={folders.loadMore}>{t(folders.pending ? 'loading' : 'moreFolders')}</Button>}
      <Button type="button" outline onClick={onClose}>{t('done')}</Button>
    </>}
    <PlanFeedback error={mutation.error ?? folders.error} status={mutation.status} />
  </div>;
}
