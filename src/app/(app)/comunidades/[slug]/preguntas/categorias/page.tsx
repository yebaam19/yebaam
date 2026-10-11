import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getQuestionContext } from '@/features/communities/server/question-context.server';
import { getQuestionCategories } from '@/features/communities/server/community-questions.server';
import { QuestionCategories } from '@/features/communities/components/questions/QuestionCategories';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const context = await getQuestionContext(slug); if (!context) notFound();
  if (!context.capabilities.content) { const t = await getTranslations('communities.questions'); return <p role="alert">{t('forbidden')}</p>; }
  const initial = await getQuestionCategories(context.community.id);
  return <QuestionCategories communityId={context.community.id} slug={slug} initial={initial} />;
}
