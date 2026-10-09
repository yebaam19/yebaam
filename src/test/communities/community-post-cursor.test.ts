import { describe, expect, it } from 'vitest';
import { parseCommunityPostCursor } from '@/features/communities/schemas/communityPostCursor.schema';

const cursor = {
  createdAt: '2026-05-02T03:55:44.672499+00:00',
  id: '7c2a7342-2554-4f50-b92b-7c808f0b7ec6',
};

describe('community post cursor', () => {
  it('accepts the precise database timestamp used to continue a page', () => {
    expect(parseCommunityPostCursor(JSON.stringify(cursor))).toEqual(cursor);
  });

  it.each([
    '{',
    JSON.stringify({ ...cursor, createdAt: 'tomorrow' }),
    JSON.stringify({ ...cursor, id: 'not-a-uuid' }),
    'x'.repeat(201),
  ])('ignores malformed or oversized URL input', (input) => {
    expect(parseCommunityPostCursor(input)).toBeNull();
  });
});
