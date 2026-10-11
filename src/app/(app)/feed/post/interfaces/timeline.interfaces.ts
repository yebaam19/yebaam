import type { Post } from './post.interfaces';

export interface TimelineCursor {
  createdAt: string;
  id: string;
}

export interface TimelinePage {
  posts: Post[];
  nextCursor: TimelineCursor | null;
}
