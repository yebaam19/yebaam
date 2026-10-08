'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import type { PlanAxis, PlanPage, PlanPoint } from '../../types/communityPlan.types';
import { PlanItemForm } from './PlanItemForm';
import { PlanItemActions } from './PlanItemActions';
import { PlanMovePoint } from './PlanMovePoint';
import { PlanOrderControls } from './PlanOrderControls';
import { usePlanInteraction } from './PlanInteractionProvider';

export function PlanPointRow({ point, number, canEdit, axes, basePath, pending, onUp, onDown }: {
  point: PlanPoint; number: number; canEdit: boolean; axes: PlanPage<PlanAxis>;
  basePath: string; pending: boolean; onUp?: () => void; onDown?: () => void;
}) {
  const interaction = usePlanInteraction();
  const editId = `point:${point.id}`;
  const moveId = `move:${point.id}`;
  const t = useTranslations('communities.plans');
  return <article className="min-w-0 py-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h3 className="min-w-0 flex-1 text-lg font-semibold wrap-anywhere">{number}. {point.title}</h3>
      {!point.is_published && <span className="text-sm text-amber-800 dark:text-amber-300">{t('draft')}</span>}
    </div>
    {point.description && <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{point.description}</p>}
    {interaction.editor === editId ? <PlanItemForm communityId={point.community_id} sectionId={point.section_id} kind="point"
      axisId={point.axis_id} item={point} editorId={editId} basePath={basePath} onClose={interaction.endEdit} />
      : point.content && <div className="prose prose-sm mt-3 max-w-prose wrap-anywhere dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: point.content }} />}
    {canEdit && <details className="mt-2">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">{t('pointActions')}</summary>
      <div className="flex flex-wrap items-center gap-x-3">
        <PlanOrderControls item={point} kind="point" disabled={pending} onUp={onUp} onDown={onDown} />
        <Button plain disabled={pending} onClick={() => interaction.beginEdit(moveId)}>{t('moveToAxis')}</Button>
      </div>
      <PlanItemActions item={point} kind="point" onEdit={() => interaction.beginEdit(editId)} />
      {interaction.editor === moveId && <PlanMovePoint point={point} axes={axes} editorId={moveId} onClose={interaction.endEdit} />}
    </details>}
  </article>;
}
