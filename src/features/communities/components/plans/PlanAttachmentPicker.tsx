'use client';

import { attachLibraryAsset } from '../../actions/library/attachments.actions';
import { LibraryAssetPicker } from '../library/LibraryAssetPicker';

export function PlanAttachmentPicker({ communityId, pointId, ...props }: {
  communityId: string; pointId: string; editorId: string; attachedIds: string[]; onClose: () => void;
}) {
  return <LibraryAssetPicker communityId={communityId} {...props}
    attach={(id, assetId) => attachLibraryAsset({ communityId, pointId, id, assetId })} />;
}
