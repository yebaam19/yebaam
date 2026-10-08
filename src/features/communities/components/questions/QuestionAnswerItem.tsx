'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { changeQuestionAnswer } from '../../actions/questions/write.actions';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';
import { usePlanMutation } from '../../hooks/usePlanMutation';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import type { QuestionAnswer } from '../../types/communityQuestion.types';
import { QuestionStatus } from './QuestionStatus';
import { QuestionByline } from './QuestionByline';
import { QuestionAnswerForm } from './QuestionAnswerForm';
import { QuestionRemoval } from './QuestionRemoval';
import { PlanFeedback } from '../plans/PlanFeedback';
export function QuestionAnswerItem({ answer, userId, canAnswer, canModerate, closed }: {
  answer: QuestionAnswer; userId: string | null; canAnswer: boolean; canModerate: boolean; closed: boolean;
}) {
  const t = useTranslations('communities.questions'); const interaction = usePlanInteraction();
  const editorId = `answer:${answer.id}`; const opener = useEditorReturnFocus(editorId); const mutation = usePlanMutation();
  const own = canAnswer && userId === answer.author_id;
  const scope = { communityId: answer.community_id, questionId: answer.question_id, id: answer.id, expectedVersion: answer.version };
  return <li className="space-y-3 py-5">
    <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">{t('official')}</p>
    <QuestionStatus isPublished={answer.is_published} hidden={!!answer.hidden_at} />
    <QuestionByline author={answer.author_name} createdAt={answer.created_at} />
    {answer.hidden_at && <p className="wrap-anywhere text-sm text-red-700 dark:text-red-300">{t('moderationReason', { reason: answer.moderation_reason })}</p>}
    {interaction.editor === editorId ? <QuestionAnswerForm communityId={answer.community_id} questionId={answer.question_id} initial={answer} editorId={editorId} onClose={interaction.endEdit} />
      : <p className="whitespace-pre-line wrap-anywhere text-sm leading-relaxed">{answer.body}</p>}
    <div className="flex flex-wrap gap-2">
      {own && !closed && !answer.hidden_at && <Button ref={opener} outline disabled={interaction.busy || !!interaction.editor} onClick={() => interaction.beginEdit(editorId)}>{t('editAnswer')}</Button>}
      {canModerate && (answer.hidden_at ? <Button outline disabled={mutation.blocked} onClick={() => mutation.run(() => changeQuestionAnswer({ ...scope, operation: 'restore' }))}>{t('restore')}</Button>
        : <QuestionRemoval id={answer.id} mode="hide" action={(reason) => changeQuestionAnswer({ ...scope, operation: 'hide', reason, confirmed: true })} />)}
      {(own || canModerate) && <QuestionRemoval id={answer.id} mode="archive" action={() => changeQuestionAnswer({ ...scope, operation: 'archive', confirmed: true })} />}
    </div><PlanFeedback {...mutation} />
  </li>;
}
