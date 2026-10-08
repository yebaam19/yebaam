import { z } from 'zod';

export const communityRoleWriteSchema = z.object({
  communityId: z.uuid(),
  userId: z.uuid().optional(),
  username: z.string().trim().min(3).max(41).optional(),
  role: z.enum(['admin', 'editor', 'moderator']),
  canEditPlans: z.boolean().default(false),
}).refine((value) => Boolean(value.userId) !== Boolean(value.username), {
  message: 'Indica un usuario.',
});

export const communityRoleRevokeSchema = z.object({
  communityId: z.uuid(),
  userId: z.uuid(),
});

export const communityRoleCursorSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }),
  userId: z.uuid(),
});
