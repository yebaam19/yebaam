'use client';

import { usePathname } from 'next/navigation';
import { useAnonChatStore } from '../store/anon-chat.store';
import AnonymousChatBubble from './AnonymousChatBubble';

/**
 * Renders open anonymous sessions as docked bubbles. A session currently shown
 * on the full-page route (`/chat/anon/<key>`) is skipped here so the same
 * Broadcast channel isn't subscribed twice (which would corrupt presence).
 */
export default function AnonymousChatTray() {
  const pathname = usePathname();
  const sessions = useAnonChatStore((s) => s.sessions);

  if (sessions.length === 0) return null;

  const segments = pathname?.split('/').filter(Boolean) ?? [];
  const fullPageKey =
    segments[0] === 'chat' && segments[1] === 'anon' ? segments[2] : undefined;

  const bubbleSessions = sessions.filter((s) => s.channelKey !== fullPageKey);
  if (bubbleSessions.length === 0) return null;

  return (
    <div className="hidden xl:contents">
      {bubbleSessions.map((session, i) => (
        <AnonymousChatBubble key={session.channelKey} session={session} position={i} />
      ))}
    </div>
  );
}
