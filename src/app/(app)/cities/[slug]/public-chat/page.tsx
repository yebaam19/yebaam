import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PublicChatPanel } from '@/features/cities/components/public-chat/PublicChatPanel';
import { getCityBySlug } from '@/features/cities/server/city.server';
import {
  getOrCreatePublicChatTopicForCityCached,
  listInitialMessages,
} from '@/features/cities/server/public-chat.server';
import { getServerClient } from '@/utils/supabase/server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  const t = await getTranslations('cities.publicChat.metadata');
  const cityName = city?.name ?? slug;
  return {
    title: t('title', { city: cityName }),
    description: t('description', { city: cityName }),
  };
}

/**
 * `/cities/[slug]/public-chat` — permanent public chat room for the city
 * (capacity 250). Pure RSC: the panel + its child list/composer are the
 * only client components, and they receive everything they need (topic id,
 * initial messages, current user id, capacity) as serialized props.
 */
export default async function PublicChatPage({ params }: Props) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const topic = await getOrCreatePublicChatTopicForCityCached(city.id);
  // The two reads are independent — kick them off in parallel so the
  // Suspense boundary does not artificially serialize them.
  const [initial, auth] = await Promise.all([
    listInitialMessages(topic.id, 50),
    getServerClient().then((c) => c.auth.getUser()),
  ]);

  return (
    <PublicChatPanel
      topicId={topic.id}
      cityName={city.name}
      initialMessages={initial}
      currentUserId={auth.data.user?.id ?? null}
      maxCapacity={topic.max_capacity}
    />
  );
}
