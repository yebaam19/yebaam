import type {
  AggregatedSearchResults,
  PageArticleSearchResult,
  PageAuditionSearchResult,
  PageEventSearchResult,
  PagePostSearchResult,
  PageSearchResult,
  SearchPageRef,
  SearchResultType,
  UserSearchResult,
} from '../interfaces/search.interfaces';

/**
 * Cliente de la búsqueda agregada: combina /api/search (páginas, publicaciones
 * de página, artículos, eventos, audiciones) con /api/search/users (personas)
 * y normaliza las filas snake_case del route handler a las interfaces del
 * feature. Sin axios — `fetch` directo según la convención del repo.
 */

const EMPTY_RESULTS: AggregatedSearchResults = {
  users: [],
  pages: [],
  posts: [],
  articles: [],
  events: [],
  auditions: [],
};

/** Facets que entiende /api/search (people va por /api/search/users). */
type AggregatedFacet = 'all' | 'pages' | 'posts' | 'articles' | 'events' | 'auditions';

/**
 * Los tipos legacy del historial (`hashtags`, `groups`) ya no tienen backend:
 * se degradan a 'all' en vez de mandar un ?type= que el route rechaza con 400.
 */
function toAggregatedFacet(type: SearchResultType): AggregatedFacet | null {
  if (type === 'users') return null; // sólo personas: no llamar /api/search
  if (type === 'hashtags' || type === 'groups') return 'all';
  return type;
}

type RawPageRef = { id: string; slug: string; name: string; profile_image_url: string | null };

type RawAggregatedResponse = {
  pages?: PageSearchResult[]; // /api/search ya devuelve mapPage() en camelCase
  posts?: Array<{ id: string; content: string | null; created_at: string; page: RawPageRef | null }>;
  articles?: Array<{
    id: string;
    title: string;
    description: string | null;
    published_at: string | null;
    page: RawPageRef | null;
  }>;
  events?: Array<{
    id: string;
    title: string;
    place: string | null;
    starts_at: string;
    page: RawPageRef | null;
  }>;
  auditions?: Array<{
    id: string;
    title: string;
    city: string | null;
    starts_at: string | null;
    page: RawPageRef | null;
  }>;
};

type RawUserResult = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
};

function mapPageRef(ref: RawPageRef | null): SearchPageRef | null {
  if (!ref) return null;
  return { id: ref.id, slug: ref.slug, name: ref.name, profileImageUrl: ref.profile_image_url };
}

function mapAggregated(json: RawAggregatedResponse): Omit<AggregatedSearchResults, 'users'> {
  const posts: PagePostSearchResult[] = (json.posts ?? []).map((r) => ({
    id: r.id,
    content: r.content ?? '',
    createdAt: r.created_at,
    page: mapPageRef(r.page),
  }));
  const articles: PageArticleSearchResult[] = (json.articles ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    publishedAt: r.published_at,
    page: mapPageRef(r.page),
  }));
  const events: PageEventSearchResult[] = (json.events ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    place: r.place,
    startsAt: r.starts_at,
    page: mapPageRef(r.page),
  }));
  const auditions: PageAuditionSearchResult[] = (json.auditions ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    city: r.city,
    startsAt: r.starts_at,
    page: mapPageRef(r.page),
  }));
  return { pages: json.pages ?? [], posts, articles, events, auditions };
}

function mapUsers(raw: RawUserResult[]): UserSearchResult[] {
  // El endpoint de usuarios devuelve fullName ya resuelto; UserResultCard
  // compone `firstName lastName`, así que el nombre completo viaja en firstName.
  return raw.map((u) => ({
    id: u.id,
    username: u.username,
    firstName: u.fullName,
    lastName: '',
    avatar: u.avatarUrl,
    bio: u.bio,
  }));
}

/**
 * Ejecuta la búsqueda para `query` + `type` y devuelve los facets combinados.
 * Lanza en errores HTTP/red (el hook los captura); un abort se propaga como
 * DOMException para que el caller lo ignore.
 */
export async function fetchSearchResults(
  query: string,
  type: SearchResultType,
  signal: AbortSignal
): Promise<AggregatedSearchResults> {
  const facet = toAggregatedFacet(type);
  const wantUsers = type === 'all' || type === 'users';

  const [aggregated, users] = await Promise.all([
    facet
      ? fetch(`/api/search?q=${encodeURIComponent(query)}&type=${facet}`, {
          credentials: 'include',
          signal,
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Search failed (${res.status})`);
          return mapAggregated((await res.json()) as RawAggregatedResponse);
        })
      : Promise.resolve({ ...EMPTY_RESULTS }),
    wantUsers
      ? fetch(`/api/search/users?q=${encodeURIComponent(query)}&limit=8`, {
          credentials: 'include',
          signal,
        }).then(async (res) => {
          if (!res.ok) throw new Error(`User search failed (${res.status})`);
          const payload = (await res.json()) as { results?: RawUserResult[] };
          return mapUsers(payload.results ?? []);
        })
      : Promise.resolve([] as UserSearchResult[]),
  ]);

  return { ...aggregated, users };
}
