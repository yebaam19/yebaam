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
  typedRoutes: true,
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  images: {
    // AVIF first (25-40% smaller than WebP for photos), WebP fallback. First
    // transform is slower but the long minimumCacheTTL amortizes it.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400 * 6,
    dangerouslyAllowSVG: true,
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
