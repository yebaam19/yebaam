'use client';

import { useTranslations } from 'next-intl';
import { Paperclip } from 'lucide-react';
import { Button } from '@/ui/Button';
import { loadPlanAttachments } from '../../actions/library/queries.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import type { PlanPoint } from '../../types/communityPlan.types';
import { LibraryAssetView } from '../library/LibraryAssetView';
import { PlanAttachmentPicker } from './PlanAttachmentPicker';
import { PlanDetachAttachment } from './PlanDetachAttachment';
import { PlanFeedback } from './PlanFeedback';
import { usePlanInteraction } from './PlanInteractionProvider';

export function PlanAttachments({ point, canEdit }: { point: PlanPoint; canEdit: boolean }) {
  const t = useTranslations('communities.attachments');
  const interaction = usePlanInteraction();
  const editorId = `attachments:${point.id}`;
  const opener = useEditorReturnFocus(editorId);
  const scope = { communityId: point.community_id, pointId: point.id };
  const page = usePlanPage(point.attachments ?? { items: [], nextCursor: null },
    (cursor) => loadPlanAttachments({ ...scope, cursor }));
  if (!canEdit && !page.items.length) return null;
  function close() {
    interaction.endEdit();
  }
  return <section aria-label={t('title')} className="mt-4 min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-2">
      {!!page.items.length && <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('title')}</h4>}
      {canEdit && <Button ref={opener} plain disabled={interaction.busy || !!interaction.editor}
        onClick={() => interaction.beginEdit(editorId)} aria-label={t('addTo', { title: point.title })}>
        <Paperclip size={16} aria-hidden="true" />{t('add')}
      </Button>}
    </div>
    {interaction.editor === editorId && <PlanAttachmentPicker {...scope} editorId={editorId}
      attachedIds={page.items.map((item) => item.asset_id)} onClose={close} />}
    <div className="grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-2">
      {page.items.map((item) => <div key={item.id} className={item.asset.kind === 'document' ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
        <LibraryAssetView asset={item.asset} canEdit={canEdit}>
          {canEdit && <PlanDetachAttachment attachment={item} />}
        </LibraryAssetView>
      </div>)}
    </div>
    {page.nextCursor && <Button outline disabled={page.pending} onClick={page.loadMore}>{t(page.pending ? 'loading' : 'more')}</Button>}
    {page.error && <PlanFeedback error={page.error} />}
  </section>;
}
