import {
  PORTAL_SECTIONS,
  type PortalCountKey,
  type PortalSection,
} from '@/features/cities/data/portal-sections';
import type { CityPortalData } from '@/features/cities/server/portal-data.server';
import { PortalTile } from './PortalTile';

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
 * The 3-column tile grid from PDF page 4.
 *
 * Desktop layout (>= lg):
 *  - Left column: 7 tall communication tiles in a vertical stack.
 *  - Center column: three wide media tiles on top, then a 2-column inner
 *    grid for the 12 directory + history/places tiles.
 *  - Right column: 5 right-rail tiles in a vertical stack.
 *
 * Mobile (< lg): everything collapses to a single column in the order
 * left → center-top → center → right. The mobile FAB CityMenu provides a
 * quick-jump alternative.
 */
export function CityPortalGrid({ citySlug, portalData }: CityPortalGridProps) {
  const left = PORTAL_SECTIONS.filter((s) => s.column === 'left');
  const centerTop = PORTAL_SECTIONS.filter((s) => s.column === 'center-top');
  const center = PORTAL_SECTIONS.filter((s) => s.column === 'center');
  const right = PORTAL_SECTIONS.filter((s) => s.column === 'right');

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)_180px]">
      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-3">
        {left.map((section) => (
          <PortalTile
            key={section.id}
            section={section}
            citySlug={citySlug}
            count={resolveCount(section, portalData)}
          />
        ))}
      </div>

      {/* CENTER COLUMN */}
      <div className="flex flex-col gap-3">
        {/* Top row — Fotos / Videos / Publicaciones */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {centerTop.map((section) => (
            <PortalTile
              key={section.id}
              section={section}
              citySlug={citySlug}
              count={resolveCount(section, portalData)}
            />
          ))}
        </div>
        {/* Inner directory + content grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {center.map((section) => (
            <PortalTile
              key={section.id}
              section={section}
              citySlug={citySlug}
              count={resolveCount(section, portalData)}
            />
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col gap-3">
        {right.map((section) => (
          <PortalTile
            key={section.id}
            section={section}
            citySlug={citySlug}
            count={resolveCount(section, portalData)}
          />
        ))}
      </div>
    </section>
  );
}
