import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postService } from '@/app/(app)/feed/post/services/post.service';
import { CreateReelModal } from '../reels/CreateReelModal';
import { ReelViewerModal } from '../reels/ReelViewerModal';
import { ReelsHeader } from '../reels/ReelsHeader';
import { ReelsFilters } from '../reels/ReelsFilters';
import { ReelCard } from '../reels/ReelCard';
import { ReelsEmptyState } from '../reels/ReelsEmptyState';
import { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';

interface PageDetailReelsProps {
  pageId: string;
  isOwner?: boolean;
}

export const PageDetailReels: FC<PageDetailReelsProps> = ({ pageId, isOwner = false }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Post | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular' | 'recent'>('all');

  // Fetch reels (posts con isReel: true) de la página
  const { data: reels = [], isLoading } = useQuery({
    queryKey: ['page-reels', pageId],
    queryFn: async () => {
      const posts = await postService.getPagePosts(pageId);
      return posts.filter((post) => post.isReel === true);
    },
    enabled: !!pageId,
  });

  // Aplicar filtros
  const filteredReels = [...reels].sort((a, b) => {
    if (activeFilter === 'popular') {
      const aLikes = Object.values(a.reactionsCount || {}).reduce((sum, count) => sum + count, 0);
      const bLikes = Object.values(b.reactionsCount || {}).reduce((sum, count) => sum + count, 0);
      return bLikes - aLikes;
    }
    if (activeFilter === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0; // 'all' - sin ordenar
  });

  const handleOpenCreateReel = () => {
    setIsCreateModalOpen(true);
  };

  const totalViews = reels.reduce((sum, reel) => {
    return sum + (reel.reactionsCount?.like || 0) * 10;
  }, 0);

  const handleReelClick = (reel: Post) => {
    setSelectedReel(reel);
    setIsViewerModalOpen(true);
  };

  const handleLike = (reelId: string) => {
    console.log('Like reel:', reelId);
    // TODO: Integrar con mutación de likes
  };

  const handleComment = (reelId: string) => {
    console.log('Comment on reel:', reelId);
    // TODO: Abrir sección de comentarios
  };

  const handleShare = (reelId: string) => {
    console.log('Share reel:', reelId);
    // TODO: Abrir modal de compartir
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ReelsHeader
        reelsCount={reels.length}
        totalViews={totalViews}
        isOwner={isOwner}
        onCreateClick={handleOpenCreateReel}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && reels.length === 0 && (
        <ReelsEmptyState isOwner={isOwner} onCreateClick={handleOpenCreateReel} />
      )}

      {/* Reels Grid */}
      {!isLoading && reels.length > 0 && (
        <>
          {/* Filter Tabs */}
          <ReelsFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredReels.map((reel) => (
              <ReelCard key={reel.id} reel={reel} onReelClick={handleReelClick} />
            ))}
          </div>
        </>
      )}

      {/* Create Reel Modal */}
      <CreateReelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        pageId={pageId}
      />

      {/* Reel Viewer Modal */}
      <ReelViewerModal
        isOpen={isViewerModalOpen}
        onClose={() => {
          setIsViewerModalOpen(false);
          setSelectedReel(null);
        }}
        reel={selectedReel}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
      />
    </div>
  );
};
