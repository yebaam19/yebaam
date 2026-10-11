import { CommunityPlanPage } from '@/features/communities/components/plans/CommunityPlanPage';
import { CommunityContentUnavailable } from '@/features/communities/components/CommunityContentUnavailable';

export default async function PlanPage({ params, searchParams }: {
  params: Promise<{ slug: string; kind: string }>;
  searchParams: Promise<{ eje?: string }>;
}) {
  const [{ slug, kind }, { eje }] = await Promise.all([params, searchParams]);
  if (kind !== 'government' && kind !== 'economy') return <CommunityContentUnavailable kind="plan" />;
  return <CommunityPlanPage slug={slug} kind={kind} axisId={eje} />;
}
