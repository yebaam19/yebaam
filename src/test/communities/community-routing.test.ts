import { describe, expect, it, vi } from 'vitest';
import { getRedirectUrl, unstable_getResponseFromNextConfig } from 'next/experimental/testing/server';
import type { NextConfig } from 'next';
import { namespacesForPath } from '@/i18n/route-namespaces';
import { getMenuForUser } from '@/config/menuConfig';
import nextConfig from '../../../next.config';

vi.mock('@sentry/nextjs', () => ({ withSentryConfig: (config: NextConfig) => config }));
vi.mock('next-intl/plugin', () => ({ default: () => (config: NextConfig) => config }));

describe('independent community routes', () => {
  it.each(['', '/qa', '/qa/articulos/articulo?view=all', '/qa/miembros?page=3'])(
    'preserves deep links and query parameters from the old prefix: %s', async (suffix) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `http://localhost:3000/feed/comunidades${suffix}`, nextConfig,
      });
      expect(response.status).toBe(308);
      expect(getRedirectUrl(response)).toBe(`http://localhost:3000/comunidades${suffix}`);
    },
  );

  it('does not redirect the canonical route or similarly named feed routes', async () => {
    for (const path of ['/comunidades/qa', '/feed/comunidades-extra']) {
      const response = await unstable_getResponseFromNextConfig({ url: `http://localhost:3000${path}`, nextConfig });
      expect(getRedirectUrl(response)).toBeNull();
    }
  });

  it('links to Communities independently of the sidebar base path', () => {
    const menu = getMenuForUser('USER', '/feed');
    expect(menu.flatMap((section) => section.items).find((item) => item.labelKey === 'items.communities')?.href)
      .toBe('/comunidades');
  });

  it.each(['/comunidades', '/comunidades/qa/articulos'])('loads community translations for %s', (path) => {
    expect(namespacesForPath(path)).toEqual(expect.arrayContaining(['communities', 'foro', 'article', 'nav']));
  });
});
