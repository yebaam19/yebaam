'use client';

import { useTranslations } from 'next-intl';
import Input from '@/ui/Input';
import Textarea from '@/ui/Textarea';
import Select from '@/ui/Select';
import { Button } from '@/ui/Button';
import { saveLibraryAsset } from '../../actions/library/content.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { LibraryAsset, FolderPage } from '../../types/communityLibrary.types';
import { PlanFeedback } from '../plans/PlanFeedback';
import { LibraryFolderSelect } from './LibraryFolderSelect';

export function LibraryAssetForm({ asset, folders, onClose }: { asset: LibraryAsset; folders: FolderPage; onClose: () => void }) {
  const t = useTranslations('communities.library');
  const mutation = usePlanMutation();
  function save(form: FormData) {
    mutation.run(() => saveLibraryAsset({ communityId: asset.community_id, id: asset.id, expectedVersion: asset.version,
      title: form.get('title'), description: form.get('description'), folderId: form.get('folderId') === 'none' ? null : form.get('folderId'),
      visibility: form.get('visibility'), isPublished: form.get('published') === 'on',
    }), onClose);
  }
  return <form onSubmit={(event) => { event.preventDefault(); save(new FormData(event.currentTarget)); }} className="space-y-4">
    <h3 className="break-words text-lg font-semibold">{t('editTitle')}</h3>
    <fieldset disabled={mutation.blocked} className="space-y-4">
      <label className="block text-sm font-medium">{t('title')}<Input autoFocus name="title" defaultValue={asset.title} required maxLength={200} className="mt-1.5" /></label>
      <label className="block text-sm font-medium">{t('description')}<Textarea name="description" defaultValue={asset.description} maxLength={4000} rows={3} className="mt-1.5" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <LibraryFolderSelect communityId={asset.community_id} kind={asset.kind} initial={folders} value={asset.folder_id} />
        <label className="block text-sm font-medium">{t('visibility')}<Select name="visibility" defaultValue={asset.visibility} className="mt-1.5">
          {(['editors', 'members', 'public'] as const).map((audience) => <option key={audience} value={audience}>{t(`audience.${audience}`)}</option>)}
        </Select></label>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="published" defaultChecked={asset.is_published} className="rounded" />{t('publish')}</label>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('publishHint')}</p>
      <div className="flex flex-wrap gap-2"><Button type="submit" color="blue">{t(mutation.pending ? 'saving' : 'save')}</Button><Button type="button" outline onClick={onClose}>{t('cancel')}</Button></div>
    </fieldset>
    <PlanFeedback error={mutation.error} status={mutation.status} />
  </form>;
}
