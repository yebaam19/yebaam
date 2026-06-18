'use client';

import type { Club } from '@/features/clubs/types/club.types';
import type { ClubPost } from '@/features/clubs/server/clubs.server';
import { ClubPostsGrid, type ViewMode } from './ClubPostsGrid';
import { ClubPhotosPanel } from './ClubPhotosPanel';
import { ClubVideosPanel } from './ClubVideosPanel';
import { ClubAboutSection } from './EditClubDetailsPanel';
import type { TabType } from './ClubTabs';

interface ClubTabContentProps {
  club: Club;
  posts: ClubPost[];
  activeTab: TabType;
  viewMode: ViewMode;
  canManage?: boolean;
  onOpenPost?: (postId: string) => void;
}

export function ClubTabContent({
  club,
  posts,
  activeTab,
  viewMode,
  canManage = false,
  onOpenPost,
}: ClubTabContentProps) {
  if (activeTab === 'acerca') {
    return <ClubAboutSection club={club} canManage={canManage} />;
  }

  if (activeTab === 'publicaciones') {
    // No filterKind → show every post, including text-only NOTE posts.
    return (
      <ClubPostsGrid posts={posts} viewMode={viewMode} onOpen={onOpenPost} />
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
