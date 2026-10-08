'use client';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Input from '@/ui/Input';
import { saveQuestionCategory } from '../../actions/questions/write.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { QuestionCategory } from '../../types/communityQuestion.types';
import { PlanFeedback } from '../plans/PlanFeedback';
export function QuestionCategoryForm({ communityId, category, onClose }: {
  communityId: string; category?: QuestionCategory; onClose: () => void;
}) {
  const t = useTranslations('communities.questions'); const mutation = usePlanMutation('category-form');
  const id = useRef(category?.id ?? null);
  return <form className="space-y-4" onSubmit={(e) => {
    e.preventDefault(); const fields = new FormData(e.currentTarget); id.current ??= crypto.randomUUID();
    mutation.run(() => saveQuestionCategory({ communityId, id: id.current, expectedVersion: category?.version ?? 0,
      title: fields.get('title'), position: Number(fields.get('position')), isPublished: fields.has('published') }), onClose);
  }}><fieldset disabled={mutation.blocked} className="space-y-3">
    <label className="block text-sm font-medium">{t('categoryName')}<Input autoFocus name="title" required maxLength={120} defaultValue={category?.title} className="mt-1" /></label>
    <label className="block max-w-48 text-sm font-medium">{t('position')}<Input type="number" name="position" min={0} max={2147483647} required defaultValue={category?.position ?? 0} className="mt-1" /></label>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={category?.is_published ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800" />{t('publishCategory')}</label>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('categoryHint')}</p>
    <div className="flex flex-wrap gap-2"><Button type="submit" color="brand">{t(mutation.pending ? 'saving' : 'save')}</Button><Button outline onClick={onClose}>{t('cancel')}</Button></div>
  </fieldset><PlanFeedback {...mutation} /></form>;
}
