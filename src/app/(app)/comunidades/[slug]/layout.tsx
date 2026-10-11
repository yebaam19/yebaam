import { Suspense, type ReactNode } from 'react';
import {
  getCommunityDetailBySlug,
  getCommunityAccessPreview,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { getCommunityTheme } from '@/features/communities/server/community-theme.server';
import { getCommunityShowcase } from '@/features/communities/server/community-showcase.server';
import { CommunityProfileHeader } from '@/features/communities/components/showcase/CommunityProfileHeader';
import { CommunityLayoutShell } from '@/features/communities/components/CommunityLayoutShell';
import { CommunityAccessPreview } from '@/features/communities/components/CommunityAccessPreview';
import { CommunityUnavailable } from '@/features/communities/components/CommunityUnavailable';
import { CommunityInstitutionalNav } from '@/features/communities/components/CommunityInstitutionalNav';
import { getCommunitySections, getCommunityProfileCapabilities, usesStructuredRules } from '@/features/communities/server/community-plan.server';

interface CommunityLayoutProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

function CommunityLayoutLoading() {
  return <div role="status" aria-busy="true" className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
    <span className="sr-only">Cargando comunidad…</span>
    <div className="h-32 bg-primary-800 sm:h-44 lg:h-72" />
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="relative -mt-10 grid gap-6 rounded-xl border-t-4 border-secondary-500 bg-white p-5 shadow-sm sm:-mt-14 xl:grid-cols-2 dark:bg-neutral-800">
        <div className="space-y-4">
          <div className="size-14 animate-pulse rounded-full bg-primary-100 motion-reduce:animate-none dark:bg-primary-900/40" />
          <div className="h-6 w-2/3 animate-pulse rounded bg-neutral-200 motion-reduce:animate-none dark:bg-neutral-700" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 motion-reduce:animate-none dark:bg-neutral-700" />
        </div>
        <div className="aspect-video animate-pulse rounded-lg bg-primary-100 motion-reduce:animate-none dark:bg-primary-900/40" />
      </div>
      <div className="mt-6 h-12 animate-pulse rounded-lg bg-white motion-reduce:animate-none dark:bg-neutral-800" />
      <div className="mt-6 h-48 animate-pulse rounded-xl bg-white motion-reduce:animate-none dark:bg-neutral-800" />
    </div>
  </div>;
}

async function CommunityLayoutContent({ params, children }: CommunityLayoutProps) {
  const { slug } = await params;
  const detail = await getCommunityDetailBySlug(slug);
  const community = detail?.community;
  if (!community) {
    const preview = await getCommunityAccessPreview(slug);
    if (!preview) return <CommunityUnavailable />;
    const viewerState = await getViewerJoinState(preview.id);
    return <><meta name="robots" content="noindex" /><CommunityAccessPreview community={preview} viewerState={viewerState} /></>;
  }

  const [viewerState, sections, capabilities, migratedRules, showcase, theme] = await Promise.all([
    getViewerJoinState(community.id), getCommunitySections(community.id),
    getCommunityProfileCapabilities(community.id), usesStructuredRules(community.id), getCommunityShowcase(community.id), getCommunityTheme(community.id),
  ]);
  const headerImages = detail.headerImages;

  return (
    <CommunityLayoutShell theme={theme} headerImages={headerImages} canManageHeader={capabilities.settings} community={community} viewerState={viewerState} profileHeader={
      <CommunityProfileHeader headerImages={headerImages} community={community} canManageHeader={capabilities.settings} canEdit={capabilities.content} showcase={showcase} />
    } institutionalNavigation={
      <CommunityInstitutionalNav slug={slug} sections={sections} canManage={capabilities.settings}
        legacyRules={!migratedRules && Boolean(community.rules?.length)} />
    }>
      {children}
    </CommunityLayoutShell>
  );
}

export default function CommunityLayout(props: CommunityLayoutProps) {
  return <Suspense fallback={<CommunityLayoutLoading />}><CommunityLayoutContent {...props} /></Suspense>;
}
