import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import type { PlanAttachment } from '../types/communityLibrary.types';
import type { PlanPage } from '../types/communityPlan.types';

/** Request-local only: previews include drafts for authorized editors. */
export const getAttachmentPreviews = cache(async (communityId: string, pointIdsJson: string) => {
  z.uuid().parse(communityId);
  const pointIds = z.array(z.uuid()).max(30).parse(JSON.parse(pointIdsJson));
  const previews = new Map<string, PlanPage<PlanAttachment>>();
  if (!pointIds.length) return previews;
  const client = await getServerClient();
  const { data, error } = await client.rpc('community_plan_attachment_previews', {
    target_community: communityId, point_ids: pointIds,
  });
  if (error) throw new Error('No se pudieron cargar los adjuntos.');
  for (const row of (data ?? []) as { point_id: string; items: PlanAttachment[] }[]) {
    const items = row.items.slice(0, 3);
    const last = items.at(-1);
    previews.set(row.point_id, {
      items, nextCursor: row.items.length > 3 && last ? { id: last.id, position: last.position } : null,
    });
  }
  return previews;
});
