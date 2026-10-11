import { describe, expect, it, vi } from 'vitest';
import { parseFirstArticleLink } from '@/app/(app)/feed/post/components/PostArticleLinkPreview';

vi.mock('@/features/communities/actions/communityArticles.actions', () => ({ getCommunityArticlePreview: vi.fn() }));

describe('shared community article links', () => {
  it.each(['/comunidades', '/feed/comunidades'])(
    'recognizes current and previously shared articles under %s', (prefix) => {
      expect(parseFirstArticleLink(`Lee https://yebaam.com${prefix}/musica/articulos/historia?ref=feed`))
        .toMatchObject({ communitySlug: 'musica', articleSlug: 'historia' });
    },
  );
});
