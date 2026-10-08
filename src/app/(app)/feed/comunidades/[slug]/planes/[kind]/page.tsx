import { notFound } from 'next/navigation';
import { CommunityPlanPage } from '@/features/communities/components/plans/CommunityPlanPage';

export default async function PlanPage({ params, searchParams }: {
  params: Promise<{ slug: string; kind: string }>;
  searchParams: Promise<{ eje?: string }>;
}) {
  const [{ slug, kind }, { eje }] = await Promise.all([params, searchParams]);
  if (kind !== 'government' && kind !== 'economy') notFound();
  return <CommunityPlanPage slug={slug} kind={kind} axisId={eje} />;
}
