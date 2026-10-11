'use client';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CameraIcon } from '@/components/icons/heroicons-shim';
import type { HeaderImages } from '../schemas/communityHeaderImage.schema';

const HeaderImageEditor = dynamic(() => import('./header-images/HeaderImageEditor').then((module) => module.HeaderImageEditor), {
  ssr: false,
  loading: () => <span role="status" className="sr-only">Cargando editor de imagen…</span>,
});

export function CommunityHeaderImageButton({ communityId, target, images, currentUrl, className }: {
  communityId: string; target: 'cover' | 'profile'; images: HeaderImages; currentUrl?: string; className?: string;
}) {
  const t = useTranslations('communities.headerImages');
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const label = t(target === 'cover' ? 'editCover' : 'editProfile');
  return <>
    <button ref={opener} type="button" onClick={() => setOpen(true)} aria-label={label} title={label}
      className={className ?? 'inline-flex size-9 items-center justify-center rounded-full bg-primary-900 text-white shadow-sm transition-colors hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-300'}>
      <CameraIcon className="size-4" />
    </button>
    {open && <HeaderImageEditor communityId={communityId} target={target} images={images} currentUrl={currentUrl}
      onClose={() => { setOpen(false); requestAnimationFrame(() => opener.current?.focus()); }} />}
  </>;
}
