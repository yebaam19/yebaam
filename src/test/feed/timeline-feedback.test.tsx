import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import FeedTimeline from '@/app/(app)/feed/post/components/FeedTimeline';

const { query } = vi.hoisted(() => ({ query: {
  data: [{ id: 'cached' }], error: new Error('network'), moreError: null,
  isLoading: false, isFetching: false, isLoadingMore: false, hasMore: true,
  refetch: vi.fn(async () => {}), loadMore: vi.fn(async () => {}),
} }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/app/(app)/feed/post/hooks/useTimelinePosts', () => ({ useTimelinePosts: () => query }));
vi.mock('@/app/(app)/feed/post/hooks/usePosts', () => ({ useSuggestedPosts: () => ({ data: [] }) }));
vi.mock('@/app/(app)/feed/post/hooks/usePostSocketEvents', () => ({ usePostSocketEvents: () => {} }));
vi.mock('@/app/(app)/feed/reacions', () => ({ useReactionSocket: () => {}, useReactionStore: () => vi.fn() }));
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/app/(app)/feed/post/components/PostCard', () => ({ default: ({ post }: { post: { id: string } }) => <article>{post.id}</article> }));

beforeEach(() => {
  vi.clearAllMocks();
  query.data = [{ id: 'cached' }];
  query.error = new Error('network');
});

it('keeps cached posts visible with a working refresh retry', () => {
  render(<FeedTimeline />);
  expect(screen.getByRole('article')).toHaveTextContent('cached');
  expect(screen.getByRole('status')).toHaveTextContent('refreshError');
  fireEvent.click(screen.getByRole('button', { name: 'retry' }));
  expect(query.refetch).toHaveBeenCalledOnce();
});

it('offers retry when the initial load failed without cached content', () => {
  query.data = [];
  render(<FeedTimeline />);
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('loadError');
  fireEvent.click(screen.getByRole('button', { name: 'retry' }));
  expect(query.refetch).toHaveBeenCalledOnce();
});
