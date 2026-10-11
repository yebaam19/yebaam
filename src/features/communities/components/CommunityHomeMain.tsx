import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { CommunityTopTabs } from './CommunityTopTabs';
import { CommunityTopTabSettings } from './CommunityTopTabSettings';
import { CommunityFeaturedSections } from './CommunityFeaturedSections';
import { CommunityThemeSettings } from './CommunityThemeSettings';
import { CommunityAdminPanel } from './CommunityAdminPanel';
import { CommunityHomePosts } from './CommunityHomePosts';
import { getPendingJoinRequests, type getCommunityHomePosts, type ViewerJoinState } from '@/features/communities/server/communities.server';
import type { Community } from '@/features/communities/types/community.types';
import { getCommunityRoleGrants } from '@/features/communities/server/community-roles.server';
import type { CommunitySection } from '../types/communityPlan.types';
import type { CommunityTheme } from '../types/communityTheme.types';
import type { CommunityTopTabConfig } from '../types/communityTopTab.types';
import type { CommunityPostCursor } from '../schemas/communityPostCursor.schema';

interface CommunityHomeMainProps {
  community: Community;
  postsPromise: ReturnType<typeof getCommunityHomePosts>;
  postsCursor: CommunityPostCursor | null;
  viewerState: ViewerJoinState;
  sections: CommunitySection[];
  topTabs: CommunityTopTabConfig;
  theme: CommunityTheme;
  canManageTheme: boolean;
}

export async function CommunityHomeMain({
  community: c,
  postsPromise,
  postsCursor,
  viewerState,
  sections,
  topTabs,
  theme,
  canManageTheme,
}: CommunityHomeMainProps) {
  const t = await getTranslations('communities');
  const isOwner = viewerState.kind === 'owner';

  return (
    <div className="space-y-4 sm:space-y-6">
      <CommunityTopTabs slug={c.slug} config={topTabs} canManage={canManageTheme} />

      {(isOwner || (canManageTheme && c.privacy === 'PRIVATE')) && (
        <Suspense fallback={<div role="status" className="mb-6 min-h-14 rounded-xl border border-primary-100 bg-white px-5 py-4 text-sm text-neutral-600 dark:border-primary-900/50 dark:bg-neutral-800 dark:text-neutral-300">Cargando administración…</div>}>
          <CommunityAdminSection communityId={c.id} privacy={c.privacy} isOwner={isOwner} />
        </Suspense>
      )}

      {canManageTheme && <div className="grid gap-2 sm:grid-cols-2">
        <CommunityThemeSettings initial={theme} />
        <CommunityTopTabSettings communityId={c.id} slug={c.slug} config={topTabs} />
      </div>}

      <CommunityFeaturedSections slug={c.slug} sections={sections} />

      <Suspense fallback={<section id="publicaciones" role="status" aria-busy="true" className="space-y-4 scroll-mt-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{t('detail.postsHeading')}</h2>
        <p className="sr-only">Cargando publicaciones…</p>
        <div className="h-32 animate-pulse rounded-xl bg-white motion-reduce:animate-none dark:bg-neutral-800" />
      </section>}>
        <CommunityHomePosts community={c} viewerState={viewerState} cursor={postsCursor} postsPromise={postsPromise} />
      </Suspense>

      {(c.description || (c.tags && c.tags.length > 0)) && <section className="rounded-lg bg-white p-4 shadow-sm sm:p-5 dark:bg-gray-800">
        <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">{t('detail.aboutTitle')}</h2>
        {c.description && <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{c.description}</p>}
        {c.tags && c.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">
          {c.tags.map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">#{tag}</span>)}
        </div>}
      </section>}
    </div>
  );
}

async function CommunityAdminSection({ communityId, privacy, isOwner }: {
  communityId: string;
  privacy: Community['privacy'];
  isOwner: boolean;
}) {
  const [pendingRequests, rolePage] = await Promise.all([
    privacy === 'PRIVATE' ? getPendingJoinRequests(communityId) : { items: [], nextCursor: null },
    isOwner ? getCommunityRoleGrants(communityId) : null,
  ]);
  return <CommunityAdminPanel key={`${communityId}:${pendingRequests.items.map((request) => request.id).join(',')}`}
    communityId={communityId} privacy={privacy} pendingRequests={pendingRequests} rolePage={rolePage} />;
}
