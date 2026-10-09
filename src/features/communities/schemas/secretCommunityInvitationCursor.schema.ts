import { z } from 'zod';

export const secretCommunityInvitationCursorSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});
