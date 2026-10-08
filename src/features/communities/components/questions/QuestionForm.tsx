'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import Input from '@/ui/Input';
import { Button } from '@/ui/Button';
import { saveCommunityQuestion } from '../../actions/questions/write.actions';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import type { CategoryPage, CommunityQuestion, QuestionCategory } from '../../types/communityQuestion.types';
import { QuestionTextField } from './QuestionTextField';
import { QuestionCategorySelect } from './QuestionCategorySelect';
import { PlanFeedback } from '../plans/PlanFeedback';
export function QuestionForm({ communityId, slug, initial, categories, category }: {
  communityId: string; slug: string; initial?: CommunityQuestion; categories: CategoryPage; category?: QuestionCategory | null;
}) {
  const t = useTranslations('communities.questions'); const router = useRouter();
  const mutation = usePlanMutation(); const id = useRef(initial?.id ?? null);
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const base = `/feed/comunidades/${slug}/preguntas`;
  return <section className="space-y-4 rounded-xl bg-white p-4 text-neutral-900 sm:p-5 dark:bg-neutral-800 dark:text-white">
    <h2 className="text-xl font-semibold">{t(initial ? 'editQuestion' : 'ask')}</h2>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('privateHint')}</p>
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault(); const fields = new FormData(e.currentTarget);
      id.current ??= crypto.randomUUID();
      mutation.run(() => saveCommunityQuestion({ communityId, id: id.current, expectedVersion: initial?.version ?? 0,
        title: fields.get('title'), body: fields.get('body'), categoryId: categoryId || null, isPublished: fields.has('published') }),
      (saved) => router.replace(`${base}/${saved.id}` as Route));
    }}><fieldset disabled={mutation.blocked} className="space-y-4">
      <label className="block text-sm font-medium">{t('questionTitle')}<Input autoFocus name="title" required maxLength={180} defaultValue={initial?.title} className="mt-1" /></label>
      <QuestionTextField label={t('body')} name="body" required rows={6} maxLength={6000} defaultValue={initial?.body} />
      <QuestionCategorySelect communityId={communityId} initial={categories} selected={category} value={categoryId} onChange={setCategoryId} disabled={mutation.blocked} />
      <label className="flex items-start gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={initial?.is_published ?? false} className="mt-0.5 rounded text-primary-800 focus:ring-primary-800" />
        <span>{t('publishQuestion')}<span className="mt-1 block text-neutral-600 dark:text-neutral-300">{t('publishHint')}</span></span></label>
      <div className="flex flex-wrap gap-2"><Button type="submit" color="brand">{t(mutation.pending ? 'saving' : 'saveQuestion')}</Button>
        <Button outline onClick={() => router.push((initial ? `${base}/${initial.id}` : base) as Route)}>{t('discard')}</Button></div>
    </fieldset><PlanFeedback {...mutation} /></form>
  </section>;
}
