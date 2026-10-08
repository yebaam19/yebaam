'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { changeCommunityQuestion } from '../../actions/questions/write.actions';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import type { CategoryPage, CommunityQuestion, QuestionCategory } from '../../types/communityQuestion.types';
import { QuestionCategorySelect } from './QuestionCategorySelect';
import { QuestionRemoval } from './QuestionRemoval';
import { PlanFeedback } from '../plans/PlanFeedback';
export function QuestionActions({ question, slug, userId, canAnswer, canModerate, categories, category }: {
  question: CommunityQuestion; slug: string; userId: string | null; canAnswer: boolean; canModerate: boolean;
  categories: CategoryPage; category: QuestionCategory | null;
}) {
  const t = useTranslations('communities.questions'); const router = useRouter(); const interaction = usePlanInteraction();
  const mutation = usePlanMutation('question-category'); const opener = useEditorReturnFocus('question-category');
  const [categoryId, setCategoryId] = useState(question.category_id ?? '');
  const base = `/feed/comunidades/${slug}/preguntas`;
  const locked = mutation.blocked || !!interaction.editor;
  const scope = { communityId: question.community_id, id: question.id, expectedVersion: question.version };
  if (!canAnswer && !canModerate && userId !== question.author_id) return null;
  return <section className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-700" aria-label={t('actions')}>
    <div className="flex flex-wrap gap-2">
      {userId === question.author_id && !question.is_closed && !question.hidden_at && <Button outline disabled={locked} onClick={() => router.push(`${base}/${question.id}/editar` as Route)}>{t('editQuestion')}</Button>}
      {canAnswer && <><Button outline disabled={locked || !!question.hidden_at || !question.is_published} onClick={() => mutation.run(() => changeCommunityQuestion({ ...scope, operation: question.is_faq ? 'unfaq' : 'faq' }))}>{t(question.is_faq ? 'unfaq' : 'markFaq')}</Button>
        <Button ref={opener} outline disabled={locked} onClick={() => { setCategoryId(question.category_id ?? ''); interaction.beginEdit('question-category'); }}>{t('categorize')}</Button></>}
      {canModerate && <><Button outline disabled={locked} onClick={() => mutation.run(() => changeCommunityQuestion({ ...scope, operation: question.is_closed ? 'reopen' : 'close' }))}>{t(question.is_closed ? 'reopen' : 'close')}</Button>
        {question.hidden_at && <Button outline disabled={locked} onClick={() => mutation.run(() => changeCommunityQuestion({ ...scope, operation: 'restore' }))}>{t('restore')}</Button>}</>}
    </div>
    {interaction.editor === 'question-category' && <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault(); mutation.run(() => changeCommunityQuestion({ ...scope, operation: 'categorize', categoryId: categoryId || null }), interaction.endEdit);
    }}><QuestionCategorySelect focusOnMount communityId={question.community_id} initial={categories} selected={category} value={categoryId} onChange={setCategoryId} disabled={mutation.blocked} />
      <div className="flex flex-wrap gap-2"><Button type="submit" color="brand" disabled={mutation.blocked}>{t(mutation.pending ? 'saving' : 'save')}</Button>
        <Button outline disabled={mutation.blocked} onClick={interaction.endEdit}>{t('cancel')}</Button></div>
    </form>}
    <div className="flex flex-wrap gap-2">
      {canModerate && !question.hidden_at && <QuestionRemoval id={question.id} mode="hide" action={(reason) => changeCommunityQuestion({ ...scope, operation: 'hide', reason, confirmed: true })} />}
      {(canModerate || userId === question.author_id) && <QuestionRemoval id={question.id} mode="archive" action={() => changeCommunityQuestion({ ...scope, operation: 'archive', confirmed: true })} onSuccess={() => router.push(base as Route)} />}
    </div>
    <PlanFeedback {...mutation} />
  </section>;
}
