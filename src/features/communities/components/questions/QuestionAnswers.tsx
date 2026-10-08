'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { loadQuestionAnswers } from '../../actions/questions/read.actions';
import { useLibraryPage } from '../../hooks/useLibraryPage';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import type { QuestionAnswer, QuestionPage } from '../../types/communityQuestion.types';
import { QuestionAnswerForm } from './QuestionAnswerForm';
import { QuestionAnswerItem } from './QuestionAnswerItem';
import { PlanFeedback } from '../plans/PlanFeedback';
export function QuestionAnswers({ communityId, questionId, initial, userId, canAnswer, canModerate, closed }: {
  communityId: string; questionId: string; initial: QuestionPage<QuestionAnswer>; userId: string | null;
  canAnswer: boolean; canModerate: boolean; closed: boolean;
}) {
  const t = useTranslations('communities.questions'); const interaction = usePlanInteraction(); const opener = useEditorReturnFocus('new-answer');
  const page = useLibraryPage(initial, (cursor) => loadQuestionAnswers({ communityId, questionId, cursor }), t('loadError'), JSON.stringify(initial));
  return <section className="space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-700">
    <h3 className="font-semibold">{t('answers')}</h3>
    {!page.items.length && <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('noAnswers')}</p>}
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">{page.items.map((answer) => <QuestionAnswerItem key={answer.id} answer={answer} userId={userId} canAnswer={canAnswer} canModerate={canModerate} closed={closed} />)}</ul>
    {page.nextCursor && <Button outline disabled={page.pending || interaction.busy || !!interaction.editor} onClick={page.loadMore}>{t(page.pending ? 'loading' : 'moreAnswers')}</Button>}
    <PlanFeedback error={page.error} />
    {closed && <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('closedHint')}</p>}
    {canAnswer && !closed && <><Button ref={opener} color="brand" disabled={interaction.busy || !!interaction.editor} onClick={() => interaction.beginEdit('new-answer')}>{t('answer')}</Button>
      {interaction.editor === 'new-answer' && <QuestionAnswerForm communityId={communityId} questionId={questionId} editorId="new-answer" onClose={interaction.endEdit} />}</>}
  </section>;
}
