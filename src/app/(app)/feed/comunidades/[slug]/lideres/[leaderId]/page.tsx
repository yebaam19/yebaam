import { CommunityLeaderPage } from '@/features/communities/components/leaders/CommunityLeadersPage';
export default async function Page({ params }: { params: Promise<{ slug: string; leaderId: string }> }) {
  return <CommunityLeaderPage {...await params} />;
}
