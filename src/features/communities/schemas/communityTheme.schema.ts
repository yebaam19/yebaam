import { z } from 'zod';

export const communityThemeSchema = z.object({
  communityId: z.uuid(),
  primaryColor: z.enum(['green', 'forest']),
  secondaryColor: z.enum(['gold', 'amber']),
  expectedVersion: z.number().int().min(0).max(2147483646),
});
