import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  experimental: process.env.NODE_ENV === 'development'
    ? {
        // Default true in Next 16; can race with chunk serving during long compiles (ChunkLoadError in dev).
        turbopackFileSystemCacheForDev: false,
      }
    : {},
  turbopack: {
    root: path.resolve(__dirname),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  typedRoutes: true,
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  images: {
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

export default nextConfig
