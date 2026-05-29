'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { AnonMessage } from '../types';
import EphemeralMedia from './EphemeralMedia';

interface EphemeralMessagesListProps {
  messages: AnonMessage[];
  isPeerTyping: boolean;
  peerNick: string;
}

/**
 * Renders the in-memory ephemeral messages. There is no loading state, no
 * pagination and no persistence — the list only ever holds what arrived this
 * session. Media bubbles are added in Phase 2 (EphemeralMedia).
 */
export default function EphemeralMessagesList({
  messages,
  isPeerTyping,
  peerNick,
}: EphemeralMessagesListProps) {
  const t = useTranslations('chat.anonymous.window');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  if (messages.length === 0 && !isPeerTyping) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 overflow-y-auto p-4 text-center">
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{t('emptyTitle')}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{t('emptySubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-4">
      {messages.map((msg) => (
        <div key={msg.id} className={cn('flex w-full', msg.isOwn ? 'justify-end' : 'justify-start')}>
          <div className={cn('max-w-[75%]', msg.isOwn && 'flex flex-col items-end')}>
            {!msg.isOwn && (
              <span className="mb-0.5 block px-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                {msg.senderNick}
              </span>
            )}
            {msg.media && (
              <div className="mb-1">
                <EphemeralMedia media={msg.media} />
              </div>
            )}
            {msg.content && (
              <div
                className={cn(
                  'rounded-2xl px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap',
                  msg.isOwn
                    ? 'rounded-br-md bg-primary-600 text-white'
                    : 'rounded-bl-md bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white',
                )}
              >
                {msg.content}
              </div>
            )}
          </div>
        </div>
      ))}

      {isPeerTyping && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-md bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} className="h-px shrink-0" />
    </div>
  );
}
