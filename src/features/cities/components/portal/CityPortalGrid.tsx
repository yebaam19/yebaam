import { getTranslations } from 'next-intl/server';
import {
  PORTAL_SECTIONS,
  resolveHref,
  type PortalCountKey,
  type PortalSection,
} from '@/features/cities/data/portal-sections';
import { getDiscoveryThumbnails } from '@/features/cities/server/discovery.server';
import type { CityPortalData } from '@/features/cities/server/portal-data.server';
import { DiscoveryTile } from './DiscoveryTile';
import { getPortalIcon } from './icons';

interface CityPortalGridProps {
  citySlug: string;
  portalData: CityPortalData;
}

function resolveCount(
  section: PortalSection,
  portalData: CityPortalData,
): number | undefined {
  if (!section.countKey) return undefined;
  const key = section.countKey as PortalCountKey;
  return portalData[key];
}

/**
 * Flat picture-card grid over every `PORTAL_SECTIONS` entry for the
 * "Explora <city>" section. Cloudflare cover image when the section has
 * one, otherwise a brand-gradient + icon fallback.
 *
 * Server component — translations and thumbnails are fetched in parallel;
 * `getDiscoveryThumbnails()` is `react.cache()`-wrapped so repeated reads
 * within the same request dedupe to a single DB hit.
 */
export async function CityPortalGrid({ citySlug, portalData }: CityPortalGridProps) {
  const [t, thumbnails] = await Promise.all([
    getTranslations('cities.portal'),
    getDiscoveryThumbnails(),
  ]);

  const comingSoonLabel = t('comingSoonPill');

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {PORTAL_SECTIONS.map((section) => {
        const count = resolveCount(section, portalData);
        const showCount = typeof count === 'number' && count > 0;
        return (
          <DiscoveryTile
            key={section.id}
            href={resolveHref(section, citySlug)}
            label={t(`sections.${section.id}.label`)}
            coverImageUrl={thumbnails[section.id]}
            Icon={getPortalIcon(section.icon)}
            count={count}
            comingSoonLabel={
              section.comingSoon && !showCount ? comingSoonLabel : undefined
            }
            sectionId={section.id}
          />
        );
      })}
    </section>
  );
}
