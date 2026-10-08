'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import type { LeaderMedia, LeaderMediaSlot } from '../../types/communityLeader.types';
import { saveLeaderMedia, detachLeaderMedia } from '../../actions/leaders/details.actions';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';
import { LibraryUnlinkControl } from '../library/LibraryUnlinkControl';

export function LeaderMediaControls({ communityId, leaderId, media }: { communityId: string; leaderId: string; media: LeaderMedia[] }) {
  const t = useTranslations('communities.leaders');
  return <section className="mt-7 space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-700">
    <h3 className="text-lg font-semibold">{t('media')}</h3><p className="text-sm text-neutral-600 dark:text-neutral-300">{t('mediaHint')}</p>
    {(['portrait', 'cover', 'video'] as const).map((slot) => <MediaSlot key={slot} communityId={communityId} leaderId={leaderId} slot={slot} media={media.find((item) => item.slot === slot)} />)}
  </section>;
}
function MediaSlot({ communityId, leaderId, slot, media }: { communityId: string; leaderId: string; slot: LeaderMediaSlot; media?: LeaderMedia }) {
  const t = useTranslations('communities.leaders');
  const interaction = usePlanInteraction();
  const editorId = `leader-media:${slot}`;
  const opener = useEditorReturnFocus(editorId);
  return <div className="border-b border-neutral-200 pb-3 last:border-0 dark:border-neutral-700">
    <div className="flex flex-wrap items-center gap-2"><div className="min-w-0 flex-1 basis-40">
      <h4 className="text-sm font-medium">{t(slot)}</h4><p className="wrap-anywhere text-sm text-neutral-600 dark:text-neutral-300">{media?.asset?.title ?? t(media ? 'unavailableMedia' : 'noMedia')}</p>
    </div><Button ref={opener} outline disabled={interaction.busy || !!interaction.editor}
      aria-label={t('chooseMedia', { slot: t(slot) })} onClick={() => interaction.beginEdit(editorId)}>{t(media ? 'replace' : 'choose')}</Button>
      {media && <LibraryUnlinkControl id={media.id} title={t(slot)} confirm={t('unlinkConfirm', { slot: t(slot) })}
        remove={() => detachLeaderMedia({ communityId, id: media.id, expectedVersion: media.version, confirmed: true })} />}
    </div>
    {interaction.editor === editorId && <LibraryAssetPicker communityId={communityId} editorId={editorId} kinds={[slot === 'video' ? 'video' : 'image']}
      attachedIds={media ? [media.asset_id] : []} onClose={interaction.endEdit}
      attach={(id, assetId) => saveLeaderMedia({ communityId, leaderId, slot, id: media?.id ?? id, assetId, expectedVersion: media?.version })} />}
  </div>;
}
