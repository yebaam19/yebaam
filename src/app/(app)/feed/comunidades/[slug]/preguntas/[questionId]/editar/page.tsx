import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { getQuestionContext } from '@/features/communities/server/question-context.server';
import { getCommunityQuestion, getQuestionCategories, getQuestionCategory } from '@/features/communities/server/community-questions.server';
import { QuestionForm } from '@/features/communities/components/questions/QuestionForm';
import { CommunityContentUnavailable } from '@/features/communities/components/CommunityContentUnavailable';
export default async function Page({ params }: { params: Promise<{ slug: string; questionId: string }> }) {
  const { slug, questionId } = await params; if (!z.uuid().safeParse(questionId).success) return <CommunityContentUnavailable kind="question" />;
  const context = await getQuestionContext(slug); if (!context) return <CommunityContentUnavailable kind="question" />;
  const question = await getCommunityQuestion(context.community.id, questionId); if (!question) return <CommunityContentUnavailable kind="question" />;
  if (question.author_id !== context.userId || question.is_closed || question.hidden_at) {
    const t = await getTranslations('communities.questions'); return <p role="alert">{t('cannotEdit')}</p>;
  }
  const [categories, category] = await Promise.all([getQuestionCategories(context.community.id),
    question.category_id ? getQuestionCategory(context.community.id, question.category_id) : null]);
  return <QuestionForm key={question.id} communityId={context.community.id} slug={slug} initial={question} categories={categories} category={category} />;
}
