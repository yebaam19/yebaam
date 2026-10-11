import { describe, expect, it, vi } from 'vitest';
import { getRedirectUrl, unstable_getResponseFromNextConfig } from 'next/experimental/testing/server';
import type { NextConfig } from 'next';
import { getMenuForUser } from '@/config/menuConfig';
import { namespacesForPath } from '@/i18n/route-namespaces';
import nextConfig from '../../next.config';

vi.mock('@sentry/nextjs', () => ({ withSentryConfig: (config: NextConfig) => config }));
vi.mock('next-intl/plugin', () => ({ default: () => (config: NextConfig) => config }));

const routes = ['profiles', 'friends', 'clubs', 'blogs', 'familias', 'professional-profile', 'chat-publico'];

describe('independent social modules', () => {
  it.each(routes)('preserves old %s deep links and query parameters', async (route) => {
    for (const suffix of ['', '/example/details?tab=all&page=2']) {
      const response = await unstable_getResponseFromNextConfig({
        url: `http://localhost:3000/feed/${route}${suffix}`, nextConfig,
      });
      expect(response.status).toBe(308);
      expect(getRedirectUrl(response)).toBe(`http://localhost:3000/${route}${suffix}`);
    }
    const response = await unstable_getResponseFromNextConfig({ url: `http://localhost:3000/${route}`, nextConfig });
    expect(getRedirectUrl(response)).toBeNull();
  });

  it.each([['/feed/amigos', '/friends'], ['/feed/profile/someone', '/someone']])(
    'consolidates the legacy screen %s', async (source, target) => {
      const response = await unstable_getResponseFromNextConfig({ url: `http://localhost:3000${source}`, nextConfig });
      expect(getRedirectUrl(response)).toBe(`http://localhost:3000${target}`);
    },
  );

  it('uses canonical menu destinations and leaves external modules alone', () => {
    const links = getMenuForUser('USER', '/feed').flatMap((section) => section.items).map((item) => item.href);
    expect(links).toEqual(expect.arrayContaining(routes.filter((r) => r !== 'familias').map((r) => `/${r}`)));
    expect(links).toEqual(expect.arrayContaining(['/negocios', '/negocios/mis-seguidos', '/artistas', '/escuelas']));
  });

  it.each([['profiles', 'profiles'], ['friends', 'feed'], ['clubs', 'clubes'], ['blogs', 'blogs'],
    ['familias', 'familias'], ['professional-profile', 'professional'], ['chat-publico', 'chat']])(
    'loads translations for %s', (route, namespace) => {
      expect(namespacesForPath(`/${route}/example`)).toContain(namespace);
    },
  );
});
