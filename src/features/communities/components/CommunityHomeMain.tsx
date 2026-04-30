import { StreamVideo } from '@/components/media/StreamVideo';
import { CommunityPostComposer } from './CommunityPostComposer';
import { CommunityPostCard } from './CommunityPostCard';
import { CommunityFeaturedPhotos } from './CommunityFeaturedPhotos';
import { CommunityTopTabs } from './CommunityTopTabs';
import { CommunityAdminPanel } from './CommunityAdminPanel';
import type {
  PendingJoinRequest,
  ViewerJoinState,
} from '@/features/communities/server/communities.server';
import type { Community, CommunityPost } from '@/features/communities/types/community.types';
import { GlobeAltIcon } from '@/components/icons/heroicons-shim';

interface CommunityHomeMainProps {
  community: Community;
  posts: CommunityPost[];
  viewerState: ViewerJoinState;
  pendingRequests: PendingJoinRequest[];
}

export function CommunityHomeMain({
  community: c,
  posts,
  viewerState,
  pendingRequests,
}: CommunityHomeMainProps) {
  const isOwner = viewerState.kind === 'owner';
  const isMember = viewerState.kind === 'member' || viewerState.kind === 'owner' || c.isMember;
  const showComposer = isMember && (c.allowMemberPosts || isOwner);

  const videos = posts
    .flatMap((p) => p.media ?? [])
    .filter((m) => m.kind === 'video' && m.cfVideoUid)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <CommunityTopTabs slug={c.slug} />

      {isOwner && (
        <CommunityAdminPanel
          communityId={c.id}
          privacy={c.privacy}
          pendingRequests={pendingRequests}
        />
      )}

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Acerca de la comunidad
        </h2>
        {c.description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {c.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">Sin descripción.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
          {c.location && (
            <span className="text-gray-700 dark:text-gray-300">
              <strong className="font-medium">Ubicación:</strong> {c.location}
            </span>
          )}
          {c.website && (
            <a
              href={c.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <GlobeAltIcon className="w-3.5 h-3.5" />
              {c.website}
            </a>
          )}
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Publicaciones</h2>
          {showComposer ? (
            <CommunityPostComposer communityId={c.id} />
          ) : !isMember ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 text-sm text-gray-600 dark:text-gray-400">
              Únete a la comunidad para publicar.
            </div>
          ) : !c.allowMemberPosts ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 text-sm text-gray-600 dark:text-gray-400">
              Solo el propietario puede publicar en esta comunidad.
            </div>
          ) : null}
          {posts.length > 0 ? (
            posts.map((post) => <CommunityPostCard key={post.id} post={post} />)
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-sm text-gray-600 dark:text-gray-400 text-center">
              No hay publicaciones aún. ¡Sé el primero en publicar!
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Videos</h2>
          {videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((m) => (
                <StreamVideo
                  key={m.cfVideoUid}
                  uid={m.cfVideoUid as string}
                  aspectRatio="16 / 9"
                  controls
                  className="rounded-md overflow-hidden"
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
              Aún no hay videos.
            </div>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Fotos destacadas</h2>
        <CommunityFeaturedPhotos posts={posts} />
      </section>
    </div>
  );
}
