import { FC } from 'react';
import type { Page } from '../types/page.types';
import { PageCard } from './PageCard';

interface PaginasGridProps {
  pages: Page[];
  showFollowButton: boolean;
  onFollowToggle: (pageId: string, isFollowing: boolean) => void;
  isFollowLoading: boolean;
}

export const PaginasGrid: FC<PaginasGridProps> = ({
  pages,
  showFollowButton,
  onFollowToggle,
  isFollowLoading,
}) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {pages.map((page) => (
      <PageCard
        key={page.id}
        page={page}
        showFollowButton={showFollowButton}
        onFollowToggle={onFollowToggle}
        isFollowLoading={isFollowLoading}
      />
    ))}
  </div>
);
