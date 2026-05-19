'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { PawIcon } from '@/components/icons/PawIcon';
import { imageUrl } from '@/lib/media/urls';
import {
  getPetPreviewByUsernameAndSlug,
  type PetLinkPreview,
} from '@/features/pets/actions/pets.actions';

/**
 * Matches a canonical pet URL with or without origin:
 *   /<username>?tab=mascotas&pet=<slug>
 * The `?tab=mascotas&pet=` ordering is what `sharePetToFeed` always produces.
 */
const PET_URL_RE =
  /(?:https?:\/\/[^\s]+)?\/([a-z0-9_-]+)\?tab=mascotas&pet=([a-z0-9-]+)(?=$|[\s&#])/i;

export interface ParsedPetLink {
  username: string;
  slug: string;
  matchedUrl: string;
}

export function parseFirstPetLink(text: string | null | undefined): ParsedPetLink | null {
  if (!text) return null;
  const m = text.match(PET_URL_RE);
  if (!m) return null;
  return {
    username: m[1].toLowerCase(),
    slug: m[2].toLowerCase(),
    matchedUrl: m[0],
  };
}

interface PostPetLinkPreviewProps {
  username: string;
  slug: string;
}

export function PostPetLinkPreview({ username, slug }: PostPetLinkPreviewProps) {
  const [preview, setPreview] = useState<PetLinkPreview | null | 'loading' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getPetPreviewByUsernameAndSlug(username, slug);
        if (!cancelled) setPreview(result);
      } catch {
        if (!cancelled) setPreview('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, slug]);

  if (preview === 'loading') {
    return (
      <div className="mt-3 h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40" />
    );
  }

  if (!preview || preview === 'error') {
    return (
      <Link
        href={`/${username}?tab=mascotas&pet=${slug}` as Route}
        className="mt-3 block break-all rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-emerald-700 hover:underline dark:border-gray-700 dark:bg-gray-800/40 dark:text-emerald-400"
      >
        Abrir mascota
      </Link>
    );
  }

  const cover = preview.coverCfImageId ? imageUrl(preview.coverCfImageId, 'public') : null;

  return (
    <Link
      href={preview.href as Route}
      className="group mt-3 flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-emerald-700"
    >
      <div className="relative aspect-square w-28 shrink-0 bg-linear-to-br from-emerald-100 via-teal-100 to-sky-100 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-sky-950/40 sm:w-36">
        {cover ? (
          <Image
            src={cover}
            alt={preview.petName}
            fill
            sizes="(max-width: 640px) 112px, 144px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawIcon className="h-10 w-10 text-emerald-500/40 dark:text-emerald-400/30" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Mascota · @{preview.ownerUsername}
        </p>
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400 sm:text-base">
          {preview.petName}
        </h4>
        <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-sm">
          {preview.species}
          {preview.breed ? ` · ${preview.breed}` : ''}
        </p>
      </div>
    </Link>
  );
}
