'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { loadPlanPoints } from '../../actions/plans/queries.actions';
import { movePlanItem } from '../../actions/plans/content.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { PlanAxis, PlanPage, PlanPoint } from '../../types/communityPlan.types';
import { planDragType, readPlanDrag } from '../../utils/plan-drag';
import { PlanPointRow } from './PlanPointRow';
import { PlanItemForm } from './PlanItemForm';
import { PlanItemActions } from './PlanItemActions';
import { PlanFeedback } from './PlanFeedback';
import { usePlanInteraction } from './PlanInteractionProvider';

export function PlanPoints({ axis, initial, axes, canEdit, basePath }: {
  axis: PlanAxis; initial: PlanPage<PlanPoint>; axes: PlanPage<PlanAxis>; canEdit: boolean; basePath: string;
}) {
  const t = useTranslations('communities.plans');
  const interaction = usePlanInteraction();
  const createId = `new-point:${axis.id}`;
  const editId = `axis:${axis.id}`;
  const scope = { communityId: axis.community_id, sectionId: axis.section_id };
  const page = usePlanPage(initial, (cursor) => loadPlanPoints({ ...scope, axisId: axis.id, cursor }));
  const mutation = usePlanMutation();
  function move(point: { id: string; version: number }, beforeId: string | null) {
    mutation.run(() => movePlanItem({ ...scope, kind: 'point', id: point.id, expectedVersion: point.version, destinationAxis: axis.id, beforeId }));
  }
  return <div className="min-w-0">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h2 className="min-w-0 flex-1 text-xl font-semibold wrap-anywhere">{axis.title}</h2>
      {!axis.is_published && <span className="text-sm text-amber-800 dark:text-amber-300">{t('draft')}</span>}
      {canEdit && <Button color="blue" disabled={mutation.blocked} onClick={() => interaction.beginEdit(createId)}>{t('new.point')}</Button>}
    </div>
    {axis.description && <p className="mt-3 max-w-prose whitespace-pre-wrap text-gray-600 dark:text-gray-300">{axis.description}</p>}
    {canEdit && <PlanItemActions item={axis} kind="axis" onEdit={() => interaction.beginEdit(editId)} />}
    {interaction.editor === editId && <PlanItemForm {...scope} kind="axis" item={axis} editorId={editId} basePath={basePath} onClose={interaction.endEdit} />}
    {interaction.editor === createId && <PlanItemForm {...scope} kind="point" axisId={axis.id} editorId={createId} basePath={basePath} onClose={interaction.endEdit} />}
    {!page.items.length && <p className="my-8 text-gray-600 dark:text-gray-300">{t('noPoints')}</p>}
    <ol className="divide-y divide-gray-200 dark:divide-gray-700">
      {page.items.map((point, index) => <li key={`${point.id}:${point.version}`}
        onDragOver={(event) => { if (canEdit && event.dataTransfer.types.includes(planDragType('point'))) event.preventDefault(); }}
        onDrop={(event) => {
          if (!canEdit || mutation.blocked) return;
          event.preventDefault();
          const dragged = readPlanDrag(event.dataTransfer, 'point');
          if (dragged && dragged.id !== point.id) move(dragged, point.id);
        }}>
        <PlanPointRow point={point} number={index + 1} canEdit={canEdit} axes={axes} basePath={basePath} pending={mutation.blocked}
          onUp={index > 0 ? () => move(point, page.items[index - 1].id) : undefined}
          onDown={index < page.items.length - 1 && (index + 2 < page.items.length || !page.nextCursor)
            ? () => move(point, page.items[index + 2]?.id ?? null) : undefined} />
      </li>)}
    </ol>
    {page.nextCursor && <Button outline disabled={page.pending} onClick={page.loadMore}>{page.pending ? t('loading') : t('loadPoints')}</Button>}
    <PlanFeedback error={page.error ?? mutation.error} status={mutation.status} />
  </div>;
}
