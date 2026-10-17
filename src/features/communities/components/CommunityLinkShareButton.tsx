'use client';

import { useId, useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import { ShareIcon } from '@/components/icons/heroicons-shim';

interface Props {
  path: string;
  title: string;
}

/** Only shares the canonical link; access remains enforced at the destination. */
export function CommunityLinkShareButton({ path, title }: Props) {
  const t = useTranslations('communities.linkShare');
  const inputId = useId();
  const [url, setUrl] = useState('');
  const [canShare, setCanShare] = useState(false);
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  const itemClass = 'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-300 dark:hover:bg-neutral-700';
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const networks = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { name: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  async function copyLink() {
    setStatus('');
    try {
      await navigator.clipboard.writeText(url);
      setStatus(t('copied'));
    } catch {
      setStatus(t('copyError'));
    }
  }

  async function shareWithDevice() {
    setStatus('');
    setPending(true);
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) {
        setStatus(t('shareError'));
      }
    } finally {
      setPending(false);
    }
  }

  return <Popover className="relative">
    <PopoverButton onClick={() => {
      setUrl(new URL(path, window.location.origin).href);
      setCanShare(typeof navigator.share === 'function');
      setStatus('');
    }} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-300 dark:hover:bg-neutral-700">
      <ShareIcon className="size-4" aria-hidden="true" />{t('button')}
    </PopoverButton>
    <PopoverPanel anchor="bottom start" portal focus
      className="z-50 w-80 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl bg-white p-4 text-neutral-900 shadow-lg [--anchor-gap:8px] [--anchor-padding:16px] dark:bg-neutral-800 dark:text-white">
      <p className="text-sm font-semibold">{t('title')}</p>
      <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{t('accessHint')}</p>
      <div className="grid grid-cols-2 gap-1">
        {networks.map(({ name, href }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer"
          aria-label={t('network', { network: name })} className={itemClass}>{name}</a>)}
      </div>
      <div className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <label htmlFor={inputId} className="text-xs font-medium">{t('link')}</label>
        <input id={inputId} type="text" readOnly value={url} onFocus={(event) => event.currentTarget.select()}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900" />
        <button type="button" onClick={() => void copyLink()} className={itemClass}>{t('copy')}</button>
        {canShare && <button type="button" disabled={pending} onClick={() => void shareWithDevice()}
          className={`${itemClass} disabled:opacity-50`}>{t('more')}</button>}
      </div>
      <p role="status" className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{status}</p>
    </PopoverPanel>
  </Popover>;
}
