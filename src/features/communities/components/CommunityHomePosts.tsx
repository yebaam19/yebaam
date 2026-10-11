import 'server-only';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { getCommunityHomePosts, ViewerJoinState } from '../server/communities.server';
import type { Community } from '../types/community.types';
import type { CommunityPostCursor } from '../schemas/communityPostCursor.schema';
import { CommunityPostComposer } from './CommunityPostComposer';
import { CommunityPostCard } from './CommunityPostCard';
import { CommunityFeaturedPhotos } from './CommunityFeaturedPhotos';

export async function CommunityHomePosts({ community: c, viewerState, cursor, postsPromise }: {
  community: Community;
  viewerState: ViewerJoinState;
  cursor: CommunityPostCursor | null;
  postsPromise: ReturnType<typeof getCommunityHomePosts>;
}) {
  const [t, result] = await Promise.all([
    getTranslations('communities'), postsPromise,
  ]);
  const { posts, nextCursor } = result;
  const firstPage = cursor === null;
  const isOwner = viewerState.kind === 'owner';
  const isMember = viewerState.kind === 'member' || isOwner || c.isMember;
  const showComposer = isMember && (c.allowMemberPosts || isOwner);

  return <>
    <section id="publicaciones" className="@container scroll-mt-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">{t('detail.postsHeading')}</h2>
        {c.stats.postsCount > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">
          {t('detail.postsCount', { count: c.stats.postsCount })}
        </span>}
      </div>
      <div className="mx-auto max-w-2xl space-y-4 @[900px]:max-w-3xl">
        {showComposer ? <CommunityPostComposer communityId={c.id} />
          : !isMember ? <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-400">{t('detail.joinToPost')}</div>
            : !c.allowMemberPosts ? <div className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-400">{t('detail.onlyOwnerPosts')}</div> : null}
        {posts.length ? posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
          : <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {t(firstPage ? 'detail.noPosts' : 'detail.noOlderPosts')}
          </div>}
        {(nextCursor || !firstPage) && <nav aria-label={t('detail.postsPagination')}
          className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {!firstPage ? <Link href={`/feed/comunidades/${c.slug}#publicaciones`}
            className="text-sm font-medium text-primary-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:text-primary-300">{t('detail.latestPosts')}</Link> : <span />}
          {nextCursor && <Link href={`/feed/comunidades/${c.slug}?postsCursor=${encodeURIComponent(JSON.stringify(nextCursor))}#publicaciones`}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary-800 px-4 py-2 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:border-primary-300 dark:text-primary-300 dark:hover:bg-primary-900/30">{t('detail.olderPosts')}</Link>}
        </nav>}
      </div>
    </section>
    {firstPage && <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">{t('detail.featuredPhotosHeading')}</h2>
      <CommunityFeaturedPhotos posts={posts} />
    </section>}
  </>;
}
