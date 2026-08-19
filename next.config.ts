import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'node:path'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  experimental: {
    // Rewrites `import { Foo } from 'pkg'` into per-icon deep imports so a route
    // only bundles the glyphs/components it renders. Matters most for the icon
    // packages: without it a single named import can pull the whole set.
    optimizePackageImports: [
      'lucide-react',
      '@hugeicons/react',
      '@hugeicons/core-free-icons',
      'date-fns',
      'recharts',
    ],
    // Default true in Next 16; can race with chunk serving during long compiles (ChunkLoadError in dev).
    ...(process.env.NODE_ENV === 'development' ? { turbopackFileSystemCacheForDev: false } : {}),
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      { source: '/messages/:id', destination: '/chat/:id', permanent: true },
      { source: '/messages', destination: '/feed', permanent: true },
      { source: '/feed/cities', destination: '/cities', permanent: true },
      { source: '/feed/cities/:path*', destination: '/cities/:path*', permanent: true },
      { source: '/feed/professional-services', destination: '/professional-services', permanent: true },
      {
        source: '/feed/professional-services/:path*',
        destination: '/professional-services/:path*',
        permanent: true,
      },
      { source: '/feed/paginas', destination: '/paginas', permanent: true },
      { source: '/feed/paginas/:path*', destination: '/paginas/:path*', permanent: true },
    ]
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  async headers() {
    // Baseline hardening headers for every route. Deliberately NOT a full
    // script-src CSP: the app embeds Cloudflare Stream, Turnstile, Sentry and
    // Supabase from many origins and a strict policy needs per-origin testing.
    // `frame-ancestors 'self'` + X-Frame-Options stop clickjacking; nosniff
    // stops MIME confusion on user uploads; Permissions-Policy limits the
    // powerful APIs (camera/mic/geo are used first-party for calls & posts).
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
  typedRoutes: true,
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  images: {
    // AVIF first (25-40% smaller than WebP for photos), WebP fallback. First
    // transform is slower but the long minimumCacheTTL amortizes it.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400 * 6,
    dangerouslyAllowSVG: true,
    // Explicit (these are the Next defaults, pinned so an upgrade can't relax them):
    // SVGs served by the optimizer are downloaded, not rendered, and sandboxed.
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'plus.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'a0.muscache.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.gstatic.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ui-avatars.com', pathname: '/api/**' },
      { protocol: 'https', hostname: 'i.pravatar.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'djf9q8s6xd4fy.cloudfront.net', pathname: '/**' },
      { protocol: 'https', hostname: 'yeebaam-posts-media-dev.s3.us-east-1.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'api.dicebear.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ws5s792r.us-east.insforge.app', pathname: '/**' },
      { protocol: 'https', hostname: '*.insforge.app', pathname: '/**' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/**' },
      { protocol: 'https', hostname: 'imagedelivery.net', pathname: '/**' },
      { protocol: 'https', hostname: 'videodelivery.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.cloudflarestream.com', pathname: '/**' },
    ],
  },
}

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
})
