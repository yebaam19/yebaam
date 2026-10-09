import { z } from 'zod';

export const communityJoinRequestCursorSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});
