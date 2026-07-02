import type { ReactNode } from 'react';
import {
  AWNING_STRIPES,
  EMPRENDIMIENTO_CATEGORY_EMOJI,
  EMPRENDIMIENTO_CATEGORY_GRADIENT,
  type EmprendimientoCategory,
} from '@/features/cities/data/emprendimientos';
import { VerifiedEntrepreneurBadge } from '../VerifiedEntrepreneurBadge';

interface Props {
  name: string;
  heroImageUrl?: string;
  zone: string | null;
  category: EmprendimientoCategory;
  verified: boolean;
  /** Client-island action buttons — per the client wireframe they stack
   *  VERTICALLY on the right side of the photo ([Recomendar] over [Contacto]). */
  actions: ReactNode;
}

/**
 * Wireframe row 1: the Foto with the two action buttons stacked at its
 * right edge. On mobile the actions drop below the image. Photo-less
 * listings get the category "market awning" fallback.
 */
export function EmprendimientoHero({ name, heroImageUrl, zone, category, verified, actions }: Props) {
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
            <div
              className={`relative flex h-full w-full items-center justify-center ${EMPRENDIMIENTO_CATEGORY_GRADIENT[category]}`}
            >
              <div className="absolute inset-0" style={AWNING_STRIPES} aria-hidden="true" />
              <span className="relative text-7xl drop-shadow-xl sm:text-8xl" aria-hidden="true">
                {EMPRENDIMIENTO_CATEGORY_EMOJI[category]}
              </span>
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
        {/* Wireframe: [Recomendar] stacked above [Contacto], right side. */}
        <div className="absolute right-4 top-4 hidden flex-col items-end gap-2 sm:flex">
          {actions}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:hidden">{actions}</div>
    </div>
  );
}
