'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { attachAboutMedia, detachAboutMedia } from '../../actions/about/content.actions';
import { loadAboutMedia } from '../../actions/about/queries.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import type { AboutMedia } from '../../types/communityAbout.types';
import type { PlanPage } from '../../types/communityPlan.types';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { PlanFeedback } from '../plans/PlanFeedback';
import { LibraryAssetView } from '../library/LibraryAssetView';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';
import { LibraryUnlinkControl } from '../library/LibraryUnlinkControl';

export function AboutMediaGallery({ communityId, aboutId, initial, canEdit }: {
  communityId: string; aboutId: string; initial: PlanPage<AboutMedia>; canEdit: boolean;
}) {
  const t = useTranslations('communities.about');
  const interaction = usePlanInteraction();
  const editorId = `about-media:${aboutId}`;
  const opener = useEditorReturnFocus(editorId);
  const page = usePlanPage(initial, (cursor) => loadAboutMedia({ communityId, aboutId, cursor }));
  if (!page.items.length && !canEdit) return null;
  return <section className="mt-7 min-w-0 border-t border-neutral-200 pt-5 dark:border-neutral-700" aria-label={t('media')}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-lg font-semibold">{t('media')}</h3>
      {canEdit && <Button ref={opener} outline disabled={interaction.busy || !!interaction.editor}
        onClick={() => interaction.beginEdit(editorId)}>{t('addMedia')}</Button>}
    </div>
    {interaction.editor === editorId && <LibraryAssetPicker communityId={communityId} editorId={editorId}
      kinds={['image', 'video']} attachedIds={page.items.map((item) => item.asset_id)} onClose={interaction.endEdit}
      attach={(id, assetId) => attachAboutMedia({ communityId, aboutId, assetId, id })} />}
    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
      {page.items.map((item) => <LibraryAssetView key={item.id} asset={item.asset} canEdit={canEdit}>
        {canEdit && <LibraryUnlinkControl id={item.id} title={item.asset.title} confirm={t('removeMediaConfirm', { title: item.asset.title })}
          remove={() => detachAboutMedia({ communityId, aboutId, assetId: item.asset_id, id: item.id, confirmed: true })} />}
      </LibraryAssetView>)}
    </div>
    {!page.items.length && <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('emptyMedia')}</p>}
    {page.nextCursor && <Button outline disabled={page.pending} onClick={page.loadMore}>{t(page.pending ? 'loading' : 'moreMedia')}</Button>}
    {page.error && <PlanFeedback error={page.error} />}
  </section>;
}
