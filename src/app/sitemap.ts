import type { MetadataRoute } from 'next';
import { getServiceClient } from '@/utils/supabase/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yebaam.com';

/**
 * Public, anonymously reachable surfaces (see PUBLIC_ROUTES in src/proxy.ts).
 * `/` and `/normativa` are deliberately absent — both redirect, which makes
 * them bad sitemap entries.
 */
const STATIC_PATHS = [
  '/login',
  '/signup',
  '/musica',
  '/musica/albumes',
  '/musica/clubes',
  '/musica/blog',
  '/musica/acerca',
  '/cities',
  '/insignias',
  '/professional-services',
  '/negocios',
  '/artistas',
  '/escuelas',
  '/programas',
  '/oportunidades',
  '/promociones',
  '/normativa/terminos',
  '/normativa/normas-comunitarias',
  '/normativa/reglamento',
];

/** Cap per content type — well under the 50k-URL sitemap limit. */
const MAX_ROWS = 5000;

export const revalidate = 86400; // regenerate at most once a day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === '/musica' ? 'daily' : 'weekly',
    priority: path === '/musica' ? 1 : 0.7,
  }));

  // Dynamic public content. Best-effort: if the DB is unreachable (e.g. a
  // build without env), ship the static entries instead of failing the route.
  try {
    const client = getServiceClient();
    const [albums, artists, cities, businesses, services, blogs, labels, musicClubs] =
      await Promise.all([
        client
          .from('music_albums')
          .select('slug, created_at')
          .order('created_at', { ascending: false })
          .limit(MAX_ROWS),
        client
          .from('music_artists')
          .select('slug, updated_at')
          .order('updated_at', { ascending: false })
          .limit(MAX_ROWS),
        client
          .from('cities')
          .select('slug, updated_at')
          .order('updated_at', { ascending: false })
          .limit(MAX_ROWS),
        client
          .from('businesses')
          .select('slug, updated_at')
          .eq('status', 'ACTIVE')
          .eq('visibility', 'PUBLIC')
          .order('updated_at', { ascending: false })
          .limit(MAX_ROWS),
        client
          .from('professional_services')
          .select('slug, updated_at')
          .eq('status', 'ACTIVE')
          .eq('visibility', 'PUBLIC')
          .order('updated_at', { ascending: false })
          .limit(MAX_ROWS),
        client
          .from('blogs')
          .select('slug, updated_at')
          .order('updated_at', { ascending: false })
          .limit(MAX_ROWS),
        client
          .from('music_labels')
          .select('slug, created_at')
          .order('created_at', { ascending: false })
          .limit(MAX_ROWS),
        // /musica/clubes/[slug] inner-joins music_genres, so only clubs with a
        // genre resolve there; private/affiliation clubs are not public surfaces.
        client
          .from('clubs')
          .select('slug, updated_at')
          .eq('privacy', 'PUBLIC')
          .not('music_genre_id', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(MAX_ROWS),
      ]);

    const addEntries = (
      rows: Array<{ slug: string; created_at?: string | null; updated_at?: string | null }> | null,
      toPath: (slug: string) => string,
      changeFrequency: 'weekly' | 'monthly' = 'monthly',
    ) => {
      for (const row of rows ?? []) {
        entries.push({
          url: `${siteUrl}${toPath(row.slug)}`,
          lastModified: row.updated_at ?? row.created_at ?? undefined,
          changeFrequency,
          priority: 0.6,
        });
      }
    };

    addEntries(albums.data, (slug) => `/musica/albumes/${slug}`);
    addEntries(artists.data, (slug) => `/musica/artistas/${slug}`);
    addEntries(cities.data, (slug) => `/cities/${slug}`, 'weekly');
    addEntries(businesses.data, (slug) => `/negocios/${slug}`, 'weekly');
    addEntries(services.data, (slug) => `/professional-services/${slug}`, 'weekly');
    addEntries(blogs.data, (slug) => `/musica/blog/${slug}`, 'weekly');
    addEntries(labels.data, (slug) => `/musica/sellos/${slug}`);
    addEntries(musicClubs.data, (slug) => `/musica/clubes/${slug}`, 'weekly');
  } catch (err) {
    console.warn('[sitemap] dynamic entries skipped:', err);
  }

  return entries;
}
