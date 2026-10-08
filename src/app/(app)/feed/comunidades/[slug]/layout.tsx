import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { CommunityLayoutShell } from '@/features/communities/components/CommunityLayoutShell';
import { CommunityInstitutionalNav } from '@/features/communities/components/CommunityInstitutionalNav';
import { getCommunitySections, getCommunityProfileCapabilities, usesStructuredRules } from '@/features/communities/server/community-plan.server';

interface CommunityLayoutProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

export default async function CommunityLayout({ params, children }: CommunityLayoutProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [viewerState, sections, capabilities, migratedRules] = await Promise.all([
    getViewerJoinState(community.id), getCommunitySections(community.id),
    getCommunityProfileCapabilities(community.id), usesStructuredRules(community.id),
  ]);

  return (
    <CommunityLayoutShell community={community} viewerState={viewerState} institutionalNavigation={
      <CommunityInstitutionalNav slug={slug} sections={sections} canManage={capabilities.settings}
        legacyRules={!migratedRules && Boolean(community.rules?.length)} />
    }>
      {children}
    </CommunityLayoutShell>
  );
}
