import 'server-only';
import { timingSafeEqual } from 'node:crypto';

export function checkInternalBearer(authorization: string | null, secret: string | undefined) {
  if (!secret || secret.length < 32) return 'unconfigured' as const;
  const provided = Buffer.from(authorization ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected)
    ? 'authorized' as const : 'unauthorized' as const;
}
