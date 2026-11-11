import Link from 'next/link';
import { getDirectoryEntries } from '@/features/cities/server/directory-entries.server';
import { isDirectoryCategory } from '@/features/cities/directory/types';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CityDirectoryCategoryView } from '@/features/cities/components/portal/CityDirectoryCategoryView';
import { PORTAL_SECTIONS } from '@/features/cities/data/portal-sections';
import { getCityBySlug } from '@/features/cities/server/city.server';
import { getCityBusinessesByCategory } from '@/features/cities/server/directory.server';

interface Props {
  params: Promise<{ slug: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
}

function knownDirectoryCategory(categoryId: string) {
  return isDirectoryCategory(categoryId) ? PORTAL_SECTIONS.find((s) => s.id === categoryId) : undefined;
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

/** Public directory reads remain session-bound and explicitly published-only. */
export default async function DirectoryCategoryPage({ params, searchParams }: Props) {
  const { slug, category } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));

  const section = knownDirectoryCategory(category);
  if (!section) notFound();

  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const [businesses, entries, sectionsT, entriesT] = await Promise.all([
    getCityBusinessesByCategory(city.id, category),
    getDirectoryEntries(city.id, category, page),
    getTranslations('cities.portal.sections'),
    getTranslations('cities.directoryEntries'),
  ]);
  const totalPages = Math.max(1, Math.ceil(entries.total / entries.pageSize));
  return (
    <CityDirectoryCategoryView
      citySlug={slug}
      cityName={city.name}
      categoryLabel={sectionsT(`${section.id}.label`)}
      businesses={page === 1 ? businesses : []}
      entries={entries.items}
      totalCount={entries.total + businesses.length}
      pagination={totalPages > 1 && <nav aria-label={entriesT('pagination')} className="flex items-center gap-4 text-sm">
        {entries.page > 1 && <Link className="underline" href={`/cities/${slug}/directory/${category}?page=${entries.page - 1}` as `/${string}`}>{entriesT('previous')}</Link>}
        <span>{entriesT('pageOf', { page: entries.page, totalPages })}</span>
        {entries.page < totalPages && <Link className="underline" href={`/cities/${slug}/directory/${category}?page=${entries.page + 1}` as `/${string}`}>{entriesT('next')}</Link>}
      </nav>}
    />
  );
}
