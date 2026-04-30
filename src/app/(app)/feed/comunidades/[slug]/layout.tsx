import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { CommunityLayoutShell } from '@/features/communities/components/CommunityLayoutShell';

interface CommunityLayoutProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

export default async function CommunityLayout({ params, children }: CommunityLayoutProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const viewerState = await getViewerJoinState(community.id);

  return (
    <CommunityLayoutShell community={community} viewerState={viewerState}>
      {children}
    </CommunityLayoutShell>
  );
}
