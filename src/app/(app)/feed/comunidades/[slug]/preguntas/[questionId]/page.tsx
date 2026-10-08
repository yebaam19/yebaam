import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getQuestionContext } from '@/features/communities/server/question-context.server';
import { getCommunityQuestion, getQuestionAnswers, getQuestionCategories, getQuestionCategory } from '@/features/communities/server/community-questions.server';
import { QuestionDetail } from '@/features/communities/components/questions/QuestionDetail';
export default async function Page({ params }: { params: Promise<{ slug: string; questionId: string }> }) {
  const { slug, questionId } = await params; if (!z.uuid().safeParse(questionId).success) notFound();
  const context = await getQuestionContext(slug); if (!context) notFound();
  const { community, capabilities, userId } = context;
  const question = await getCommunityQuestion(community.id, questionId); if (!question) notFound();
  const [answers, categories, category] = await Promise.all([getQuestionAnswers(community.id, question.id),
    getQuestionCategories(community.id), question.category_id ? getQuestionCategory(community.id, question.category_id) : null]);
  return <QuestionDetail key={question.id} question={question} slug={slug} userId={userId} answers={answers}
    categories={categories} category={category} canAnswer={capabilities.content} canModerate={capabilities.moderation} />;
}
