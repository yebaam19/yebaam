import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CityDirectoryCategoryView } from '@/features/cities/components/portal/CityDirectoryCategoryView';
import { PORTAL_SECTIONS } from '@/features/cities/data/portal-sections';
import {
  getCityBusinessesByCategory,
  getCityBySlug,
} from '@/features/cities/server/city.server';

interface Props {
  params: Promise<{ slug: string; category: string }>;
}

/**
 * Restrict the dynamic segment to category ids that actually point at the
 * directory under-construction route shape — anything else (e.g. a stray
 * `/directory/foo`) renders a 404. The same predicate also gates the
 * generated metadata so unknown slugs don't get a friendly title.
 */
function knownDirectoryCategory(categoryId: string) {
  const section = PORTAL_SECTIONS.find((s) => s.id === categoryId);
  if (!section) return null;
  if (!section.hrefTemplate.startsWith('/cities/:slug/directory/')) return null;
  return section;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, category } = await params;
  const section = knownDirectoryCategory(category);
  if (!section) return {};

  const [city, sectionsT, metaT] = await Promise.all([
    getCityBySlug(slug),
    getTranslations('cities.portal.sections'),
    getTranslations('cities.directoryCategory.metadata'),
  ]);
  if (!city) return {};

  const categoryLabel = sectionsT(`${section.id}.label`);
  return {
    title: metaT('title', { city: city.name, category: categoryLabel }),
    description: metaT('description', { city: city.name, category: categoryLabel.toLowerCase() }),
  };
}

/**
 * Phase 5 directory category page. Lists `businesses` joined to
 * `business_categories.slug = [category]` and filtered by the current city,
 * via the cached `getCityBusinessesByCategory()` server reader. The 10
 * categories seeded by migration `20260518044233_add_city_id_to_community_surfaces`
 * are: government, education, food, nightlife, lodging, religion, malls,
 * sports, health, grocery.
 *
 * An unknown category id (anything not in PORTAL_SECTIONS pointing at the
 * directory route) returns 404. An empty result set (city has no businesses
 * in this category yet) renders the view with an empty state — only Popayán
 * is seeded today, so most cities will exercise that path.
 */
export default async function DirectoryCategoryPage({ params }: Props) {
  const { slug, category } = await params;

  const section = knownDirectoryCategory(category);
  if (!section) notFound();

  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const [businesses, sectionsT] = await Promise.all([
    getCityBusinessesByCategory(city.id, category),
    getTranslations('cities.portal.sections'),
  ]);

  return (
    <CityDirectoryCategoryView
      citySlug={slug}
      cityName={city.name}
      categoryLabel={sectionsT(`${section.id}.label`)}
      businesses={businesses}
    />
  );
}
