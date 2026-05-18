'use client';

/**
 * MessageList — chronological message stream for the City Portal public
 * chat. Renders avatar + display name + relative timestamp + body, and
 * auto-scrolls to bottom on new messages, but only when the user is already
 * near the bottom so we never yank them out of scroll-back history.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { UserCircleIcon } from '@/components/icons/heroicons-shim';
import type { PublicChatMessage } from '@/features/cities/server/public-chat.server';

interface MessageListProps {
  messages: PublicChatMessage[];
  currentUserId: string | null;
}

const NEAR_BOTTOM_PX = 120;

function relativeTime(iso: string, now: number): string {
  const created = new Date(iso).getTime();
  const diffSec = Math.round((created - now) / 1000);
  const fmt = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const abs = Math.abs(diffSec);
  if (abs < 60) return fmt.format(diffSec, 'second');
  if (abs < 3600) return fmt.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return fmt.format(Math.round(diffSec / 3600), 'hour');
  return fmt.format(Math.round(diffSec / 86400), 'day');
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const t = useTranslations('cities.publicChat.messages');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wasNearBottomRef = useRef<boolean>(true);
  const prevLenRef = useRef<number>(messages.length);
  // `nowTick` starts as `null` on the server (renders an absolute fallback)
  // then gets a real timestamp on the client. Without this, the client and
  // server pick different `Date.now()` values one tick apart and React
  // throws a hydration mismatch on the relative timestamp text.
  const [nowTick, setNowTick] = useState<number | null>(null);

  useEffect(() => {
    // Defer the initial setState off the synchronous effect body — same
    // escape hatch used in `ReactionListModal` to satisfy
    // react-hooks/set-state-in-effect. We schedule the first tick on the
    // microtask queue so the post-hydration render picks it up cleanly.
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setNowTick(Date.now());
    });
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Sample whether the user is near the bottom BEFORE the DOM mutates from
  // a new message append. useLayoutEffect runs after DOM commit but before
  // paint, so we record the position before the new node forces a scroll
  // jump, then conditionally restore it post-commit.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    wasNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_PX;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const grew = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;
    if (grew && wasNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex h-full min-h-[200px] items-center justify-center px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400"
      >
        <p>{t('empty')}</p>
      </div>
    );
  }

  // Render newest-at-bottom — server returns desc, we reverse for display.
  const ordered = [...messages].reverse();

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-3 py-4 sm:px-4"
      data-testid="public-chat-message-list"
    >
      <ol className="flex flex-col gap-3">
        {ordered.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            isOwn={Boolean(currentUserId) && m.sender_id === currentUserId}
            now={nowTick}
            youLabel={t('you')}
          />
        ))}
      </ol>
    </div>
  );
}

/**
 * Absolute-time fallback used on the server-rendered HTML and during the
 * first client commit — keeps SSR and the hydration pass byte-identical.
 * Picking `en-CA` style (`YYYY-MM-DD HH:mm`) avoids locale drift between
 * `process.env.TZ` on the server and `Intl` on the browser.
 */
function absoluteTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

function MessageRow({
  message,
  isOwn,
  now,
  youLabel,
}: {
  message: PublicChatMessage;
  isOwn: boolean;
  now: number | null;
  youLabel: string;
}) {
  const author = message.author;
  const displayName = isOwn ? youLabel : author?.displayName ?? message.sender_nickname ?? 'Usuario';
  const avatarUrl = author?.avatarUrl ?? message.sender_avatar_url ?? null;
  const timeLabel = now === null ? absoluteTimestamp(message.created_at) : relativeTime(message.created_at, now);

  return (
    <li className="flex items-start gap-3">
      <div className="shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={36}
            height={36}
            className="rounded-full"
            style={{ width: 36, height: 36 }}
            unoptimized
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300">
            <UserCircleIcon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {displayName}
          </p>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {timeLabel}
          </span>
        </div>
        {message.content && (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-neutral-800 dark:text-neutral-200">
            {message.content}
          </p>
        )}
      </div>
    </li>
  );
}
