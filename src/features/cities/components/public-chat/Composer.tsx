'use client';

/**
 * Composer — controlled textarea + send button for the City Portal public
 * chat. Enter submits, shift+enter inserts a newline. The send button is
 * disabled when the body is empty or a transition is pending so duplicate
 * dispatches can't pile up.
 */

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { PaperAirplaneIcon } from '@/components/icons/heroicons-shim';

interface ComposerProps {
  /** Called with the trimmed body when the user dispatches a send. */
  onSend: (body: string) => Promise<void> | void;
}

export function Composer({ onSend }: ComposerProps) {
  const t = useTranslations('cities.publicChat.composer');
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isPending;

  const dispatchSend = () => {
    if (!canSend) return;
    const body = trimmed;
    setValue('');
    startTransition(async () => {
      await onSend(body);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      dispatchSend();
    }
  };

  return (
    <div className="border-t border-neutral-200 bg-white px-3 py-3 dark:border-neutral-700 dark:bg-neutral-800 sm:px-4">
      <div className="flex items-end gap-2">
        <label htmlFor="public-chat-composer" className="sr-only">
          {t('placeholder')}
        </label>
        <textarea
          id="public-chat-composer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          rows={1}
          className="block max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-primary-500 dark:focus:bg-neutral-900"
          aria-label={t('placeholder')}
          disabled={isPending}
        />
        <button
          type="button"
          onClick={dispatchSend}
          disabled={!canSend}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
          aria-label={t('send')}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
          <span className="sr-only">{t('send')}</span>
        </button>
      </div>
    </div>
  );
}
