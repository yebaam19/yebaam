'use client';

import type { Club } from '@/features/clubs/types/club.types';
import type { ClubPost } from '@/features/clubs/server/clubs.server';
import { ClubPostsGrid, type ViewMode } from './ClubPostsGrid';
import { ClubPhotosPanel } from './ClubPhotosPanel';
import { ClubVideosPanel } from './ClubVideosPanel';
import { formatDate } from '@/features/clubs/utils/clubHelpers';
import type { TabType } from './ClubTabs';

interface ClubTabContentProps {
  club: Club;
  posts: ClubPost[];
  activeTab: TabType;
  viewMode: ViewMode;
  onOpenPost?: (postId: string) => void;
}

export function ClubTabContent({
  club,
  posts,
  activeTab,
  viewMode,
  onOpenPost,
}: ClubTabContentProps) {
  if (activeTab === 'acerca') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Acerca de este club
        </h2>
        <p className="leading-relaxed text-gray-700 dark:text-gray-300">{club.description}</p>

        {club.rules && club.rules.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Reglas del club
            </h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {club.rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
        )}

        {club.tags && club.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {club.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Creado el {formatDate(new Date(club.createdAt))}
        </div>
      </div>
    );
  }

  if (activeTab === 'fotos') {
    return <ClubPhotosPanel posts={posts} />;
  }

  if (activeTab === 'videos') {
    return <ClubVideosPanel posts={posts} />;
  }

  const filterMap: Record<'articulos' | 'archivos', ClubPost['kind']> = {
    articulos: 'ARTICLE',
    archivos: 'FILE',
  };

  return (
    <ClubPostsGrid
      posts={posts}
      filterKind={filterMap[activeTab]}
      viewMode={viewMode}
      onOpen={onOpenPost}
    />
  );
}
