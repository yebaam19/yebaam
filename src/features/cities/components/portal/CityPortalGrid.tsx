import { getTranslations } from 'next-intl/server';
import {
  PORTAL_SHORTCUTS,
  resolveHref,
} from '@/features/cities/data/portal-sections';
import { getDiscoveryThumbnails } from '@/features/cities/server/discovery.server';
import { DiscoveryTile } from './DiscoveryTile';
import { getPortalIcon } from './icons';

interface CityPortalGridProps {
  citySlug: string;
}

/**
 * Flat picture-card grid over the `PORTAL_SHORTCUTS` subset (business
 * directory categories + city history) for the "Explora <city>" section.
 * Cloudflare cover image when the section has one, otherwise a
 * brand-gradient + icon fallback.
 *
 * Server component — translations and thumbnails are fetched in parallel;
 * `getDiscoveryThumbnails()` is `react.cache()`-wrapped so repeated reads
 * within the same request dedupe to a single DB hit.
 */
export async function CityPortalGrid({ citySlug }: CityPortalGridProps) {
  const [t, thumbnails] = await Promise.all([
    getTranslations('cities.portal'),
    getDiscoveryThumbnails(),
  ]);

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {PORTAL_SHORTCUTS.map((section) => (
        <DiscoveryTile
          key={section.id}
          href={resolveHref(section, citySlug)}
          label={t(`sections.${section.id}.label`)}
          coverImageUrl={thumbnails[section.id]}
          Icon={getPortalIcon(section.icon)}
          sectionId={section.id}
        />
      ))}
    </section>
  );
}
