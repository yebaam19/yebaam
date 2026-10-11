import { z } from 'zod';
import { getQuestionContext } from '@/features/communities/server/question-context.server';
import { getCommunityQuestion, getQuestionAnswers, getQuestionCategories, getQuestionCategory } from '@/features/communities/server/community-questions.server';
import { QuestionDetail } from '@/features/communities/components/questions/QuestionDetail';
import { CommunityContentUnavailable } from '@/features/communities/components/CommunityContentUnavailable';
export default async function Page({ params }: { params: Promise<{ slug: string; questionId: string }> }) {
  const { slug, questionId } = await params; if (!z.uuid().safeParse(questionId).success) return <CommunityContentUnavailable kind="question" />;
  const context = await getQuestionContext(slug); if (!context) return <CommunityContentUnavailable kind="question" />;
  const { community, capabilities, userId } = context;
  const question = await getCommunityQuestion(community.id, questionId); if (!question) return <CommunityContentUnavailable kind="question" />;
  const [answers, categories, category] = await Promise.all([getQuestionAnswers(community.id, question.id),
    getQuestionCategories(community.id), question.category_id ? getQuestionCategory(community.id, question.category_id) : null]);
  return <QuestionDetail key={question.id} question={question} slug={slug} userId={userId} answers={answers}
    categories={categories} category={category} canAnswer={capabilities.content} canModerate={capabilities.moderation} />;
}
