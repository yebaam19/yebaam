import 'server-only';
import { after } from 'next/server';
import { processCommunityChatCaseMail } from './community-chat-case-mail.server';

/** The case and in-app notice have committed; email failures stay in the outbox. */
export function scheduleChatCaseMail() {
  try {
    after(async () => {
      try { await processCommunityChatCaseMail(); }
      catch { console.error('[community-chat-case] Mail retained for retry.'); }
    });
  } catch { console.error('[community-chat-case] Mail scheduling unavailable.'); }
}
