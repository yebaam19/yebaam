import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { MapPinIcon } from '@/components/icons/heroicons-shim';
import type { CityDetail } from '@/features/cities/server/city.server';
import { FollowCityButton } from './FollowCityButton';

interface CityPortalCoverProps {
  city: CityDetail;
  isFollowing: boolean;
}

/**
 * Hero cover for the City Portal detail page.
 *
 * Renders eagerly (NOT inside Suspense) so the city name, state/country chip,
 * and Seguir button paint with the page shell. The tile grid streams in
 * underneath. The only client component on the page is the inner
 * `<FollowCityButton>` — keeping client JS minimal is what protects the
 * Lighthouse Performance budget.
 */
export async function CityPortalCover({ city, isFollowing }: CityPortalCoverProps) {
  const t = await getTranslations('cities.portal');
  const headerT = await getTranslations('cities.header');

  const locationLabel = city.state
    ? `${city.state.name}, ${city.country.name}`
    : city.country.name;

  return (
    <section className="relative isolate h-[260px] overflow-hidden rounded-2xl bg-linear-to-br from-primary-500 via-primary-600 to-primary-800 text-white sm:h-[320px]">
      {/* Cover image (Cloudflare Images, when present) — else the gradient
          background of the parent <section> shows through. */}
      {city.coverImageUrl && (
        <Image
          src={city.coverImageUrl}
          alt={t('coverAlt', { city: city.name })}
          fill
          className="object-cover brightness-[0.5]"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          unoptimized
        />
      )}

      {/* Bottom-to-top dim gradient so the title stays readable on any
          background image. */}
      <div className="absolute inset-0 z-1 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

      {/* Follow toggle, anchored top-right. */}
      <div className="absolute right-4 top-4 z-10">
        <FollowCityButton
          cityId={city.id}
          citySlug={city.slug}
          initialFollowing={isFollowing}
        />
      </div>

      {/* Title block, anchored bottom-left. */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs backdrop-blur-sm sm:text-sm">
          <MapPinIcon className="h-4 w-4" />
          <span>{locationLabel}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {city.name}
        </h1>
        {city.stats.followerCount > 0 && (
          <p className="mt-2 text-xs text-white/80 sm:text-sm">
            {city.stats.followerCount.toLocaleString()} {headerT('stats.members').toLowerCase()}
          </p>
        )}
      </div>
    </section>
  );
}
