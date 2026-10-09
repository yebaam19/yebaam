import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { CommunityPostComposer } from './CommunityPostComposer';
import { CommunityPostCard } from './CommunityPostCard';
import { CommunityFeaturedPhotos } from './CommunityFeaturedPhotos';
import { CommunityTopTabs } from './CommunityTopTabs';
import { CommunityTopTabSettings } from './CommunityTopTabSettings';
import { CommunityFeaturedSections } from './CommunityFeaturedSections';
import { CommunityThemeSettings } from './CommunityThemeSettings';
import { CommunityAdminPanel } from './CommunityAdminPanel';
import type {
  PendingJoinRequest,
  ViewerJoinState,
} from '@/features/communities/server/communities.server';
import type { Community, CommunityPost } from '@/features/communities/types/community.types';
import { getCommunityRoleGrants } from '@/features/communities/server/community-roles.server';
import type { CommunitySection } from '../types/communityPlan.types';
import type { CommunityTheme } from '../types/communityTheme.types';
import type { CommunityTopTabConfig } from '../types/communityTopTab.types';
import type { CommunityPostCursor } from '../schemas/communityPostCursor.schema';

interface CommunityHomeMainProps {
  community: Community;
  posts: CommunityPost[];
  nextPostsCursor: CommunityPostCursor | null;
  isFirstPostsPage: boolean;
  viewerState: ViewerJoinState;
  pendingRequests: PendingJoinRequest[];
  sections: CommunitySection[];
  topTabs: CommunityTopTabConfig;
  theme: CommunityTheme;
  canManageTheme: boolean;
}

export async function CommunityHomeMain({
  community: c,
  posts,
  nextPostsCursor,
  isFirstPostsPage,
  viewerState,
  pendingRequests,
  sections,
  topTabs,
  theme,
  canManageTheme,
}: CommunityHomeMainProps) {
  const t = await getTranslations('communities');
  const isOwner = viewerState.kind === 'owner';
  const rolePage = isOwner ? await getCommunityRoleGrants(c.id) : null;
  const isMember = viewerState.kind === 'member' || viewerState.kind === 'owner' || c.isMember;
  const showComposer = isMember && (c.allowMemberPosts || isOwner);

  return (
    <div className="space-y-6">
      <CommunityTopTabs slug={c.slug} config={topTabs} canManage={canManageTheme} />

      {(isOwner || (canManageTheme && c.privacy === 'PRIVATE')) && (
        <CommunityAdminPanel
          communityId={c.id}
          privacy={c.privacy}
          pendingRequests={pendingRequests}
          rolePage={rolePage}
        />
      )}

      {canManageTheme && <CommunityThemeSettings initial={theme} />}
      {canManageTheme && <CommunityTopTabSettings communityId={c.id} slug={c.slug} config={topTabs} />}

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          {t('detail.aboutTitle')}
        </h2>
        {c.description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {c.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">{t('detail.noDescription')}</p>
        )}
        {c.tags && c.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </section>

      <CommunityFeaturedSections slug={c.slug} sections={sections} />

      <section id="publicaciones" className="@container scroll-mt-6">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
            {t('detail.postsHeading')}
          </h2>
          {c.stats.postsCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('detail.postsCount', { count: c.stats.postsCount })}
            </span>
          )}
        </div>

        <div className="mx-auto max-w-2xl space-y-4 @[900px]:max-w-3xl">
          {showComposer ? (
            <CommunityPostComposer communityId={c.id} />
          ) : !isMember ? (
            <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-400">
              {t('detail.joinToPost')}
            </div>
          ) : !c.allowMemberPosts ? (
            <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-400">
              {t('detail.onlyOwnerPosts')}
            </div>
          ) : null}

          {posts.length > 0 ? (
            posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              {t(isFirstPostsPage ? 'detail.noPosts' : 'detail.noOlderPosts')}
            </div>
          )}
          {(nextPostsCursor || !isFirstPostsPage) && (
            <nav aria-label={t('detail.postsPagination')} className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {!isFirstPostsPage ? (
                <Link href={`/feed/comunidades/${c.slug}#publicaciones`}
                  className="text-sm font-medium text-primary-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:text-primary-300">
                  {t('detail.latestPosts')}
                </Link>
              ) : <span />}
              {nextPostsCursor && (
                <Link href={`/feed/comunidades/${c.slug}?postsCursor=${encodeURIComponent(JSON.stringify(nextPostsCursor))}#publicaciones`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary-800 px-4 py-2 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:border-primary-300 dark:text-primary-300 dark:hover:bg-primary-900/30">
                  {t('detail.olderPosts')}
                </Link>
              )}
            </nav>
          )}
        </div>
      </section>


      {isFirstPostsPage && <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
          {t('detail.featuredPhotosHeading')}
        </h2>
        <CommunityFeaturedPhotos posts={posts} />
      </section>}
    </div>
  );
}
