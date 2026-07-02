import type { ReactNode } from 'react';
import { RocketLaunchIcon } from '@/components/icons/heroicons-shim';
import { VerifiedEntrepreneurBadge } from '../VerifiedEntrepreneurBadge';

interface Props {
  name: string;
  heroImageUrl?: string;
  zone: string | null;
  verified: boolean;
  /** Client-island action buttons overlaid top-right on ≥sm. */
  actions: ReactNode;
}

/**
 * Wireframe row 1: hero photo with [Recomendar][Contacto]. The name lives on
 * the photo's bottom gradient so the page has a headline; on mobile the
 * actions render below the image instead of overlaying it.
 */
export function EmprendimientoHero({ name, heroImageUrl, zone, verified, actions }: Props) {
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <div className="aspect-[16/9] w-full sm:aspect-[21/9]">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={name}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800">
              <RocketLaunchIcon className="h-16 w-16 text-white/30" />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-white drop-shadow sm:text-3xl">{name}</h1>
          {verified && <VerifiedEntrepreneurBadge variant="pill" />}
          {zone && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
              {zone}
            </span>
          )}
        </div>
        <div className="absolute right-4 top-4 hidden gap-2 sm:flex">{actions}</div>
      </div>
      <div className="flex flex-wrap gap-2 sm:hidden">{actions}</div>
    </div>
  );
}
