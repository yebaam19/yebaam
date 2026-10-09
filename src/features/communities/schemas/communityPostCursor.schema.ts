import { z } from 'zod';

export const communityPostCursorSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});

export type CommunityPostCursor = z.infer<typeof communityPostCursorSchema>;

export function parseCommunityPostCursor(value: string | undefined): CommunityPostCursor | null {
  if (!value) return null;
  if (value.length > 200) return null;
  try {
    const result = communityPostCursorSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
