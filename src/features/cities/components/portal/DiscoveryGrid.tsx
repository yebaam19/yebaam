import { getTranslations } from 'next-intl/server';
import {
  DISCOVERY_SECTIONS,
  resolveDiscoveryHref,
} from '@/features/cities/data/discovery-sections';
import { getDiscoveryThumbnails } from '@/features/cities/server/city.server';
import { DiscoveryTile } from './DiscoveryTile';

interface DiscoveryGridProps {
  citySlug: string;
}

/**
 * The "Explora <city>" 3×3 discovery grid. RSC: loads category thumbnails
 * server-side once per request, hands them down to pure `DiscoveryTile`
 * children. The thumbnails are shared across all cities (one upload per
 * category), so the same data hit serves every city detail page.
 */
export async function DiscoveryGrid({ citySlug }: DiscoveryGridProps) {
  const [t, thumbnails] = await Promise.all([
    getTranslations('cities.portal.discovery'),
    getDiscoveryThumbnails(),
  ]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {DISCOVERY_SECTIONS.map((section) => (
        <DiscoveryTile
          key={section.id}
          href={resolveDiscoveryHref(section, citySlug)}
          label={t(`${section.id}.label`)}
          coverImageUrl={thumbnails[section.id]}
        />
      ))}
    </div>
  );
}
