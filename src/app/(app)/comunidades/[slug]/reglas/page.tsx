import { CommunityPlanPage } from '@/features/communities/components/plans/CommunityPlanPage';

export default async function CommunityRulesPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ eje?: string }>;
}) {
  const [{ slug }, { eje }] = await Promise.all([params, searchParams]);
  return <CommunityPlanPage slug={slug} kind="rules" axisId={eje} />;
}
