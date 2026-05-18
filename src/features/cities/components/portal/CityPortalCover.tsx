import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { MapPinIcon, UserGroupIcon } from '@/components/icons/heroicons-shim';
import type { CityDetail } from '@/features/cities/server/city.server';
import { FollowCityButton } from './FollowCityButton';

interface CityPortalCoverProps {
  city: CityDetail;
  isFollowing: boolean;
}

/**
 * Hero cover for the City Portal detail page.
 *
 * Renders eagerly (NOT inside Suspense) so the country chip, city name and
 * follower count paint with the page shell. The tile grid streams in
 * underneath. The only client component on the page is the inner
 * `<FollowCityButton>` — keeping client JS minimal is what protects the
 * Lighthouse Performance budget. Mirrors the layout in `public/city.png`:
 * green country chip top-left, large name, follower pill below, follow CTA
 * floating top-right.
 */
export async function CityPortalCover({ city, isFollowing }: CityPortalCoverProps) {
  const t = await getTranslations('cities.portal');
  const headerT = await getTranslations('cities.header');

  return (
    <section className="relative isolate h-[260px] overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5 sm:h-[320px] dark:ring-white/5">
      {/* Cover image (Cloudflare Images, when present) — else the gradient
          background of the parent <section> shows through. */}
      {city.coverImageUrl && (
        <Image
          src={city.coverImageUrl}
          alt={t('coverAlt', { city: city.name })}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          unoptimized
        />
      )}

      {/* Two stacked scrims — bottom-to-top for the title, plus a faint
          left-to-right wash so the country chip stays readable. */}
      <div className="absolute inset-0 z-1 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
      <div className="absolute inset-0 z-1 bg-gradient-to-r from-black/35 via-transparent to-transparent" />

      {/* Country chip (green pill), anchored top-left. */}
      <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/15 backdrop-blur-sm sm:text-sm">
          <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {city.country.name}
        </span>
      </div>

      {/* Follow toggle, anchored top-right. */}
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <FollowCityButton
          cityId={city.id}
          citySlug={city.slug}
          initialFollowing={isFollowing}
        />
      </div>

      {/* Title block, anchored bottom-left. */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
        <h1 className="text-3xl font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-4xl lg:text-5xl">
          {city.name}
        </h1>
        {city.description && (
          <p className="mt-2 max-w-xl text-sm leading-snug text-white/85 drop-shadow-sm sm:text-base">
            {city.description}
          </p>
        )}
        {city.stats.followerCount > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-md ring-1 ring-white/15 sm:text-sm">
            <UserGroupIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {city.stats.followerCount.toLocaleString()} {headerT('stats.members').toLowerCase()}
          </p>
        )}
      </div>
    </section>
  );
}
