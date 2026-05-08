'use client';

import { usePathname } from 'next/navigation';
import { useChatStore } from '@/features/chat/store/chat.store';
import ChatBubble from './ChatBubble';

const RESERVED_TOP_LEVEL = new Set([
  'messages',
  'notifications',
  'search',
  'grupos',
  'foro',
  'stories',
  'chat',
  'login',
  'signup',
  'forgot-password',
  'reset-password',
  'verify-email',
  'api',
]);

function hasRightRail(pathname: string | null): boolean {
  if (!pathname) return false;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (!first) return false;
  if (first === 'feed') return true;
  return segments.length === 1 && !RESERVED_TOP_LEVEL.has(first);
}

export default function ChatBubbleTray() {
  const pathname = usePathname();
  const openBubbles = useChatStore((s) => s.openBubbles);
  const closeBubble = useChatStore((s) => s.closeBubble);

  if (openBubbles.length === 0) return null;

  const baseOffset = hasRightRail(pathname) ? 320 : 16;

  return (
    <div className="hidden xl:contents">
      {openBubbles.map((b, i) => (
        <ChatBubble
          key={b.contactId}
          contactId={b.contactId}
          contactName={b.contactName}
          contactAvatar={b.contactAvatar}
          isOnline={b.isOnline}
          position={i}
          baseOffset={baseOffset}
          onClose={() => closeBubble(b.contactId)}
        />
      ))}
    </div>
  );
}
