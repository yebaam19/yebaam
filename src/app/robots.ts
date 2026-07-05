import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yebaam.com';

/**
 * Crawling policy mirrors src/proxy.ts: only the PUBLIC_ROUTES surface is
 * reachable anonymously, so everything auth-gated (or ephemeral, like the
 * public chat) is disallowed to keep crawl budget on indexable content.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
