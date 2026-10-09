'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@/components/icons/heroicons-shim';

export function CommunityImageLightbox({ src, title, square = false }: {
  src: string; title: string; square?: boolean;
}) {
  const t = useTranslations('communities.library');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" onClick={() => dialog.current?.showModal()}
      aria-label={t('openImage', { title })}
      className={`relative block w-full overflow-hidden rounded-lg bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 dark:bg-neutral-900 ${square ? 'aspect-square' : 'aspect-[4/3]'}`}>
      <Image src={src} alt={title} fill sizes={square ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px' : '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 300px'}
        className="object-cover" unoptimized />
    </button>
    <dialog ref={dialog} aria-label={title} onClose={() => trigger.current?.focus()}
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
      className="fixed inset-0 m-auto max-h-[95dvh] w-[min(94vw,1200px)] max-w-none rounded-xl border border-neutral-200 bg-white p-3 text-neutral-900 shadow-2xl backdrop:bg-neutral-950/85 sm:p-4 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold">{title}</p>
        <button type="button" onClick={() => dialog.current?.close()} aria-label={t('closeImage')}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-neutral-200 dark:hover:bg-neutral-800">
          <XMarkIcon aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="relative h-[min(75dvh,760px)] w-full bg-neutral-100 dark:bg-neutral-950">
        <Image src={src} alt={title} fill sizes="94vw" className="object-contain" unoptimized />
      </div>
    </dialog>
  </>;
}
