import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType } from 'react';

interface DiscoveryTileProps {
  href: string;
  label: string;
  /** Cloudflare delivery URL for the category thumbnail. When missing, a
   *  branded gradient + the `Icon` (if provided) fills the frame so layout
   *  doesn't shift. */
  coverImageUrl?: string;
  /** Heroicon component rendered low-opacity on the gradient fallback when
   *  no thumbnail is available — keeps the tile visually intentional. */
  Icon?: ComponentType<{ className?: string }>;
  /** Numeric badge rendered top-right. Hidden when 0 or undefined. */
  count?: number;
  /** Already-translated "Soon" pill label rendered top-right when the
   *  section is coming-soon AND `count` is empty. Keeps i18n out of the
   *  tile so it stays renderable in both RSC and client trees. */
  comingSoonLabel?: string;
  /** Stable id forwarded as `data-section-id` for tests/analytics. */
  sectionId?: string;
}

/**
 * Image-backed picture-card tile for the city detail "Explora <city>" grid.
 * Pure presentational — receives a pre-resolved href + i18n-translated strings, so it stays
 * renderable inside both RSC and client trees.
 */
export function DiscoveryTile({
  href,
  label,
  coverImageUrl,
  Icon,
  count,
  comingSoonLabel,
  sectionId,
}: DiscoveryTileProps) {
  const showCountPill = typeof count === 'number' && count > 0;
  const showComingSoonPill = !showCountPill && Boolean(comingSoonLabel);

  return (
    <Link
      href={href as `/${string}`}
      aria-label={label}
      data-section-id={sectionId}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-200 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:ring-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:bg-neutral-800 dark:ring-white/5"
    >
      {coverImageUrl ? (
        <Image
          src={coverImageUrl}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 dark:from-primary-700 dark:via-primary-800 dark:to-primary-950" />
          {Icon ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="h-20 w-20 text-white/25 transition-all duration-500 group-hover:scale-[1.08] group-hover:text-white/40" />
            </div>
          ) : null}
        </>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <h3 className="text-sm font-bold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] sm:text-base">
          {label}
        </h3>
      </div>

      {showCountPill && (
        <span className="absolute right-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-600 px-2 text-[11px] font-semibold text-white shadow-sm">
          {count}
        </span>
      )}
      {showComingSoonPill && (
        <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 shadow-sm dark:bg-amber-900/60 dark:text-amber-200">
          {comingSoonLabel}
        </span>
      )}
    </Link>
  );
}
