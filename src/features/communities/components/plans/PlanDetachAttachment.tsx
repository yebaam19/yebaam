'use client';

import { useTranslations } from 'next-intl';
import { detachLibraryAsset } from '../../actions/library/attachments.actions';
import type { PlanAttachment } from '../../types/communityLibrary.types';
import { LibraryUnlinkControl } from '../library/LibraryUnlinkControl';

export function PlanDetachAttachment({ attachment }: { attachment: PlanAttachment }) {
  const t = useTranslations('communities.attachments');
  return <LibraryUnlinkControl id={attachment.id} title={attachment.asset.title}
    confirm={t('confirm', { title: attachment.asset.title })} remove={() => detachLibraryAsset({
      communityId: attachment.community_id, pointId: attachment.point_id,
      assetId: attachment.asset_id, id: attachment.id, confirmed: true,
    })} />;
}
