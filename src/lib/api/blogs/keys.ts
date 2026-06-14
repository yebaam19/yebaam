const BLOG_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Which column to match a blog `[idOrSlug]` route param against. Branch on the
 * UUID shape instead of `.or(id.eq,slug.eq)` — the latter casts a slug to uuid
 * for the `id` side and errors (22P02), making the whole lookup fail.
 */
export function blogKey(idOrSlug: string): 'id' | 'slug' {
  return BLOG_UUID_RE.test(idOrSlug) ? 'id' : 'slug';
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `blog-${Date.now()}`;
}
