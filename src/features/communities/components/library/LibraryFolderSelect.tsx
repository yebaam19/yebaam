'use client';

import { useTranslations } from 'next-intl';
import Select from '@/ui/Select';
import { Button } from '@/ui/Button';
import { loadAssetFolders } from '../../actions/library/queries.actions';
import { useLibraryPage } from '../../hooks/useLibraryPage';
import type { AssetKind, FolderPage } from '../../types/communityLibrary.types';

export function LibraryFolderSelect({ communityId, kind, initial, value, includeAll = false, disabled = false }: {
  communityId: string; kind: AssetKind; initial: FolderPage; value?: string | null; includeAll?: boolean; disabled?: boolean;
}) {
  const t = useTranslations('communities.library');
  const folders = useLibraryPage(initial, (cursor) => loadAssetFolders({ communityId, kind, cursor }));
  return <div className="min-w-0 space-y-1">
    <label className="block text-sm font-medium">{t('folder')}
      <Select name="folderId" defaultValue={value ?? (includeAll ? 'all' : 'none')} disabled={disabled} className="mt-1.5">
        {includeAll && <option value="all">{t('allFolders')}</option>}
        <option value="none">{t('noFolder')}</option>
        {value && !['all', 'none'].includes(value) && !folders.items.some((folder) => folder.id === value) && <option value={value}>{t('currentFolder')}</option>}
        {folders.items.map((folder) => <option key={folder.id} value={folder.id}>{folder.title}{folder.is_visible ? '' : ` · ${t('hidden')}`}</option>)}
      </Select>
    </label>
    {folders.nextCursor && <Button type="button" plain disabled={disabled || folders.pending} onClick={folders.loadMore}>{t(folders.pending ? 'loading' : 'moreFolders')}</Button>}
    {folders.error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{folders.error}</p>}
  </div>;
}
