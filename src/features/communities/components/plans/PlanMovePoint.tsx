'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Select from '@/ui/Select';
import { movePlanItem } from '../../actions/plans/content.actions';
import { loadPlanAxes } from '../../actions/plans/queries.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { PlanAxis, PlanPage, PlanPoint } from '../../types/communityPlan.types';
import { PlanFeedback } from './PlanFeedback';

export function PlanMovePoint({ point, axes, onClose, editorId, isRules }: {
  point: PlanPoint; axes: PlanPage<PlanAxis>; onClose: () => void; editorId: string; isRules: boolean;
}) {
  const t = useTranslations('communities.plans');
  const mutation = usePlanMutation(editorId);
  const scope = { communityId: point.community_id, sectionId: point.section_id };
  const page = usePlanPage(axes, (cursor) => loadPlanAxes({ ...scope, cursor }));
  const [destination, setDestination] = useState('');
  return <div className="mt-3 space-y-3">
    <label className="block text-sm font-medium">{t(isRules ? 'rules.destination' : 'destination')}
      <Select value={destination} onChange={(event) => setDestination(event.target.value)} disabled={mutation.blocked}>
        <option value="">{t(isRules ? 'rules.chooseAxis' : 'chooseAxis')}</option>
        {page.items.filter((axis) => axis.id !== point.axis_id).map((axis) => <option key={axis.id} value={axis.id}>{axis.title}</option>)}
      </Select>
    </label>
    {page.nextCursor && <Button plain disabled={page.pending} onClick={page.loadMore}>{t(isRules ? 'rules.loadAxes' : 'loadAxes')}</Button>}
    <div className="flex flex-wrap gap-2">
      <Button color="brand" disabled={!destination || mutation.blocked} onClick={() => mutation.run(() => movePlanItem({
        ...scope, kind: 'point', id: point.id, expectedVersion: point.version, destinationAxis: destination,
      }), onClose)}>{t(isRules ? 'rules.move' : 'move')}</Button>
      <Button outline disabled={mutation.blocked} onClick={onClose}>{t('cancel')}</Button>
    </div>
    <PlanFeedback error={mutation.error ?? page.error} status={mutation.status} />
  </div>;
}
