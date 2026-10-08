import 'server-only';
import { after } from 'next/server';
import { processAssetCleanup } from './asset-cleanup.server';

/** The DB write already committed; cleanup failure must not make it ambiguous. */
export function scheduleAssetCleanup() {
  try {
    after(async () => {
      try {
        const result = await processAssetCleanup();
        if (result.retrying) console.warn('[community-cleanup] Jobs retained for retry:', result.retrying);
      } catch { console.error('[community-cleanup] Batch deferred to scheduled retry.'); }
    });
  } catch { console.error('[community-cleanup] Scheduling unavailable; outbox retained.'); }
}
