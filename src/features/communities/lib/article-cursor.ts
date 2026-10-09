import { z } from 'zod';

const cursorSchema = z.object({ createdAt: z.iso.datetime({ offset: true }), id: z.uuid() });

export function parseArticleCursor(raw: unknown) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw !== 'string' || raw.length > 512) throw new Error('Invalid article cursor');
  return cursorSchema.parse(JSON.parse(raw));
}
