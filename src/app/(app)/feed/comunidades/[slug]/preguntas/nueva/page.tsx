import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getQuestionContext } from '@/features/communities/server/question-context.server';
import { getQuestionCategories } from '@/features/communities/server/community-questions.server';
import { QuestionForm } from '@/features/communities/components/questions/QuestionForm';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const context = await getQuestionContext(slug); if (!context) notFound();
  if (!context.userId) { const t = await getTranslations('communities.questions'); return <p role="alert">{t('signIn')}</p>; }
  const categories = await getQuestionCategories(context.community.id);
  return <QuestionForm communityId={context.community.id} slug={slug} categories={categories} />;
}
