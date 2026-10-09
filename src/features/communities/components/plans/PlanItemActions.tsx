'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/ui/Button';
import { deletePlanItem, savePlanItem } from '../../actions/plans/content.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { PlanAxis, PlanPoint } from '../../types/communityPlan.types';
import { PlanFeedback } from './PlanFeedback';

export function PlanItemActions({ item, kind, onEdit, isRules = false }: {
  item: PlanAxis | PlanPoint; kind: 'axis' | 'point'; onEdit: () => void; isRules?: boolean;
}) {
  const t = useTranslations('communities.plans');
  const mutation = usePlanMutation();
  const [confirming, setConfirming] = useState(false);
  const scope = { communityId: item.community_id, sectionId: item.section_id, id: item.id, kind, expectedVersion: item.version };
  const deleteConfirmKey = kind === 'point' ? 'deletePointConfirm' : isRules ? 'rules.deleteAxisConfirm' : 'deleteAxisConfirm';
  return <div>
    <div className="flex flex-wrap gap-1">
      <Button plain onClick={onEdit} disabled={mutation.blocked} aria-label={t('editNamed', { title: item.title })}>
        <Pencil size={16} aria-hidden="true" />{t('editLabel')}
      </Button>
      <Button plain disabled={mutation.blocked} onClick={() => mutation.run(() => savePlanItem({
        ...scope, title: item.title, description: item.description,
        ...('axis_id' in item ? { axisId: item.axis_id, content: item.content } : {}),
        isPublished: !item.is_published,
      }))}>
        {item.is_published ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        {t(item.is_published ? 'hide' : 'publish')}
      </Button>
      <Button plain disabled={mutation.blocked} onClick={() => setConfirming(true)}
        aria-label={t('deleteNamed', { title: item.title })}>
        <Trash2 size={16} aria-hidden="true" />{t('delete')}
      </Button>
    </div>
    {confirming && <div className="mt-3 space-y-3 rounded-lg bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
      <p>{t(deleteConfirmKey, { title: item.title })}</p>
      <div className="flex flex-wrap gap-2">
        <Button color="red" disabled={mutation.blocked}
          onClick={() => mutation.run(() => deletePlanItem({ ...scope, confirmed: true }), () => setConfirming(false))}>
          {t('confirmDelete')}
        </Button>
        <Button outline disabled={mutation.blocked} onClick={() => setConfirming(false)}>{t('cancel')}</Button>
      </div>
    </div>}
    <PlanFeedback {...mutation} />
  </div>;
}
