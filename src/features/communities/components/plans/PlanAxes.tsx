'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { loadPlanAxes } from '../../actions/plans/queries.actions';
import { movePlanItem } from '../../actions/plans/content.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { CommunitySection, PlanAxis, PlanPage } from '../../types/communityPlan.types';
import { axisPath } from '../../utils/plan-navigation';
import { planDragType, readPlanDrag } from '../../utils/plan-drag';
import { PlanOrderControls } from './PlanOrderControls';
import { PlanFeedback } from './PlanFeedback';

export function PlanAxes({ section, initial, selectedId, basePath, canEdit, onCreate }: {
  section: CommunitySection; initial: PlanPage<PlanAxis>; selectedId?: string;
  basePath: string; canEdit: boolean; onCreate: () => void;
}) {
  const t = useTranslations('communities.plans');
  const isRules = section.kind === 'rules';
  const [expanded, setExpanded] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const navigationId = useId();
  const scope = { communityId: section.community_id, sectionId: section.id };
  const page = usePlanPage(initial, (cursor) => loadPlanAxes({ ...scope, cursor }));
  const mutation = usePlanMutation();
  function move(item: { id: string; version: number }, beforeId: string | null) {
    mutation.run(() => movePlanItem({ ...scope, kind: 'axis', id: item.id, expectedVersion: item.version, beforeId }));
  }
  return <div className="min-w-0">
    <button type="button" aria-expanded={expanded} aria-controls={navigationId} onClick={() => setExpanded(!expanded)}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-left text-sm font-medium text-neutral-800 focus-visible:outline-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 xl:hidden dark:bg-neutral-900 dark:text-neutral-100">
      <span>{t(isRules ? 'rules.axes' : 'axes')}</span><ChevronDown size={18} aria-hidden="true" className={expanded ? 'rotate-180' : ''} />
    </button>
    <div id={navigationId} className={expanded ? 'block' : 'hidden xl:block'}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="hidden text-sm font-semibold xl:block">{t(isRules ? 'rules.axes' : 'axes')}</h3>
      {canEdit && <div className="flex flex-wrap gap-1">
        <Button plain disabled={mutation.blocked} onClick={onCreate}>{t(isRules ? 'rules.new.axis' : 'new.axis')}</Button>
        <Button plain aria-pressed={ordering} onClick={() => setOrdering(!ordering)}>{t('reorder')}</Button>
      </div>}
    </div>
    {!page.items.length && <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">{t(isRules ? 'rules.noAxes' : 'noAxes')}</p>}
    <nav aria-label={t(isRules ? 'rules.axes' : 'axes')} className="mt-3">
      <ol className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {page.items.map((axis, index) => <li key={axis.id} className="py-2"
          onDragOver={(event) => {
            if (canEdit && (event.dataTransfer.types.includes(planDragType('axis')) || event.dataTransfer.types.includes(planDragType('point')))) event.preventDefault();
          }}
          onDrop={(event) => {
            if (!canEdit || mutation.blocked) return;
            event.preventDefault();
            const point = readPlanDrag(event.dataTransfer, 'point');
            const draggedAxis = readPlanDrag(event.dataTransfer, 'axis');
            if (point) mutation.run(() => movePlanItem({
              ...scope, kind: 'point', id: point.id, expectedVersion: point.version, destinationAxis: axis.id,
            }));
            else if (draggedAxis && draggedAxis.id !== axis.id) move(draggedAxis, axis.id);
          }}>
          <Link href={axisPath(basePath, axis.id) as Route} aria-current={selectedId === axis.id ? 'page' : undefined}
            aria-disabled={mutation.blocked || undefined} tabIndex={mutation.blocked ? -1 : undefined}
            onClick={(event) => { if (mutation.blocked) event.preventDefault(); else setExpanded(false); }}
            className={`block rounded-lg px-3 py-2.5 text-sm wrap-anywhere focus-visible:outline-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 ${selectedId === axis.id
              ? 'bg-secondary-100 font-semibold text-primary-900 dark:bg-primary-900 dark:text-secondary-200'
              : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'}`}>
            {axis.title}
            {!axis.is_published && <span className="ml-2 text-xs">({t('draft')})</span>}
          </Link>
          {canEdit && ordering && <PlanOrderControls item={axis} kind="axis" disabled={mutation.blocked}
            onUp={index > 0 ? () => move(axis, page.items[index - 1].id) : undefined}
            onDown={index < page.items.length - 1 && (index + 2 < page.items.length || !page.nextCursor)
              ? () => move(axis, page.items[index + 2]?.id ?? null) : undefined} />}
        </li>)}
      </ol>
    </nav>
    {page.nextCursor && <Button outline disabled={page.pending} onClick={page.loadMore} className="mt-3">
      {page.pending ? t('loading') : t(isRules ? 'rules.loadAxes' : 'loadAxes')}
    </Button>}
    <PlanFeedback error={page.error ?? mutation.error} status={mutation.status} />
    </div>
  </div>;
}
