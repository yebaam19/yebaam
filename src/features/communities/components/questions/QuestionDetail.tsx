'use client';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import type { CategoryPage, CommunityQuestion, QuestionAnswer, QuestionCategory, QuestionPage } from '../../types/communityQuestion.types';
import { PlanInteractionProvider, usePlanInteraction } from '../plans/PlanInteractionProvider';
import { QuestionStatus } from './QuestionStatus';
import { QuestionByline } from './QuestionByline';
import { QuestionActions } from './QuestionActions';
import { QuestionAnswers } from './QuestionAnswers';
type Props = { question: CommunityQuestion; slug: string; userId: string | null; canAnswer: boolean; canModerate: boolean;
  answers: QuestionPage<QuestionAnswer>; categories: CategoryPage; category: QuestionCategory | null };
export function QuestionDetail(props: Props) { return <PlanInteractionProvider><Detail {...props} /></PlanInteractionProvider>; }
function Detail(props: Props) {
  const { question, slug, answers, category } = props;
  const t = useTranslations('communities.questions'); const router = useRouter(); const interaction = usePlanInteraction();
  return <article className="space-y-4 rounded-xl bg-white p-4 text-neutral-900 sm:p-5 dark:bg-neutral-800 dark:text-white">
    <Button plain disabled={interaction.busy || !!interaction.editor} onClick={() => router.push(`/feed/comunidades/${slug}/preguntas` as Route)}>{t('back')}</Button>
    <QuestionStatus isPublished={question.is_published} closed={question.is_closed} faq={question.is_faq} hidden={!!question.hidden_at} />
    <h2 className="wrap-anywhere text-xl font-semibold">{question.title}</h2>
    <QuestionByline author={question.author_name} createdAt={question.created_at} />
    {category && <p className="wrap-anywhere text-sm text-neutral-600 dark:text-neutral-300">{category.title}</p>}
    {!question.is_published && <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('privateHint')}</p>}
    {question.hidden_at && <p className="wrap-anywhere text-sm text-red-700 dark:text-red-300">{t('moderationReason', { reason: question.moderation_reason })}</p>}
    <p className="whitespace-pre-line wrap-anywhere text-sm leading-relaxed">{question.body}</p>
    <QuestionActions {...props} />
    <QuestionAnswers communityId={question.community_id} questionId={question.id} initial={answers} userId={props.userId}
      canAnswer={props.canAnswer} canModerate={props.canModerate} closed={question.is_closed || !!question.hidden_at} />
  </article>;
}
