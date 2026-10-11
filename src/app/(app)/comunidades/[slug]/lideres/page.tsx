import { CommunityLeadersPage } from '@/features/communities/components/leaders/CommunityLeadersPage';
export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ categoria?: string }>;
}) {
  const [{ slug }, { categoria }] = await Promise.all([params, searchParams]);
  return <CommunityLeadersPage slug={slug} category={categoria} />;
}
