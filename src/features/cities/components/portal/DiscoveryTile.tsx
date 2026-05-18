import Image from 'next/image';
import Link from 'next/link';

interface DiscoveryTileProps {
  href: string;
  label: string;
  /** Cloudflare delivery URL for the category thumbnail. When missing, a
   *  neutral gradient fills the frame so layout doesn't shift. */
  coverImageUrl?: string;
}

/**
 * Image-backed discovery tile for the city detail "Explora <city>" grid.
 * Pure presentational — receives a pre-resolved href + i18n-translated
 * label, so it stays renderable inside both RSC and client trees.
 */
export function DiscoveryTile({ href, label, coverImageUrl }: DiscoveryTileProps) {
  return (
    <Link
      href={href as `/${string}`}
      aria-label={label}
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
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-500 dark:from-neutral-700 dark:to-neutral-900" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <h3 className="text-sm font-bold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] sm:text-base">
          {label}
        </h3>
      </div>
    </Link>
  );
}
