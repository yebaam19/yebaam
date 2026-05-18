import { getCityTrending, type CityDetail } from '@/features/cities/server/city.server';
import { CityFactsCard } from './CityFactsCard';
import { CityTrendingList } from './CityTrendingList';

interface CityPortalSidebarProps {
  city: CityDetail;
}

/**
 * Right rail of the city detail page. Stacks the "Conoce <city>" facts card
 * and the "En tendencia" list. Streams in under a Suspense boundary at the
 * page level, so the cover and the discovery grid don't block on its query.
 */
export async function CityPortalSidebar({ city }: CityPortalSidebarProps) {
  const trending = await getCityTrending(city.id, 3);

  return (
    <aside aria-label={city.name} className="space-y-4">
      <CityFactsCard cityName={city.name} facts={city.facts} />
      <CityTrendingList citySlug={city.slug} items={trending} />
    </aside>
  );
}
