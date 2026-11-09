import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yebaam.com';

/**
 * Crawling policy mirrors src/proxy.ts: only the PUBLIC_ROUTES surface is
 * reachable anonymously, so everything auth-gated (or ephemeral, like the
 * public chat) is disallowed to keep crawl budget on indexable content.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    '/admin/',
    '/api/',
    '/feed/',
    '/chat/',
    '/settings',
    '/notifications',
    '/stories/',
    '/search',
    '/auth/',
    '/verification/',
    '/verify-email',
    '/reset-password',
    '/forgot-password',
    '/monitoring',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        // Specific groups replace *, so retain its private-route exclusions.
        // Training crawler only: search and user-directed agents keep access.
        disallow: [...privatePaths, '/musica$', '/musica?', '/musica/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
