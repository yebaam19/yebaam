'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { deleteLibraryAsset } from '../../actions/library/content.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { LibraryAsset } from '../../types/communityLibrary.types';
import { PlanFeedback } from '../plans/PlanFeedback';

export function LibraryDeleteAsset({ asset, onClose }: { asset: LibraryAsset; onClose: () => void }) {
  const t = useTranslations('communities.library');
  const mutation = usePlanMutation();
  return <div className="space-y-3">
    <h3 className="break-words text-lg font-semibold">{t('deleteConfirm', { title: asset.title })}</h3>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('deleteHint')}</p>
    <div className="flex flex-wrap gap-2"><Button color="red" disabled={mutation.blocked}
      onClick={() => mutation.run(() => deleteLibraryAsset({ communityId: asset.community_id, id: asset.id, expectedVersion: asset.version, confirmed: true }), onClose)}>{t(mutation.pending ? 'saving' : 'delete')}</Button>
      <Button outline disabled={mutation.pending} onClick={onClose}>{t('cancel')}</Button></div>
    <PlanFeedback error={mutation.error} status={mutation.status} />
  </div>;
}
