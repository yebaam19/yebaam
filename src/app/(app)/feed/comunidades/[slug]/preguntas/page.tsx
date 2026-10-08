import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getQuestionContext } from '@/features/communities/server/question-context.server';
import { getCommunityQuestions, getQuestionCategories, getQuestionCategory } from '@/features/communities/server/community-questions.server';
import { questionQuerySchema } from '@/features/communities/schemas/communityQuestion.schema';
import { QuestionsIndex } from '@/features/communities/components/questions/QuestionsIndex';
export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, raw] = await Promise.all([params, searchParams]);
  const context = await getQuestionContext(slug); if (!context) notFound();
  const { community, capabilities, userId } = context;
  const query = questionQuerySchema.parse({ communityId: community.id,
    search: typeof raw.search === 'string' ? raw.search.slice(0, 160) : '',
    categoryId: raw.category === 'none' ? null : z.uuid().safeParse(raw.category).success ? raw.category : undefined,
    view: raw.view === 'faq' ? 'faq' : raw.view === 'mine' && userId ? 'mine' : raw.view === 'moderation' && capabilities.moderation ? 'moderation' : 'all',
    state: raw.state === 'open' || raw.state === 'closed' ? raw.state : 'all',
  });
  const [initial, categories, category] = await Promise.all([getCommunityQuestions(JSON.stringify(query)),
    getQuestionCategories(community.id), query.categoryId ? getQuestionCategory(community.id, query.categoryId) : null]);
  return <QuestionsIndex key={JSON.stringify([query, initial, userId])} slug={slug} query={query} initial={initial}
    categories={categories} category={category} signedIn={!!userId} canAnswer={capabilities.content} canModerate={capabilities.moderation} />;
}
