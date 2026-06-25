import '@/styles/tailwind.css';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import 'rc-slider/assets/index.css';

import { AuthProvider } from '@/features/auth/context/auth-context';
import { ThemeSync } from '@/components/settings/ThemeSync';

import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineIndicator from '@/components/OfflineIndicator';
import { SocketProvider } from '@/providers/socket-provider';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yebaam.com';
const siteDescription =
  'Yebaam es una plataforma social donde puedes conectar, compartir y descubrir contenido con personas de todo el mundo.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s - Yebaam',
    default: 'Yebaam - Conecta con el mundo',
  },
  description: siteDescription,
  keywords: ['yebaam', 'red social', 'conectar', 'amigos', 'compartir'],
  // The site-wide OG image (logo) is supplied by app/opengraph-image.tsx, which
  // Next injects into both `og:image` and `twitter:image` automatically.
  openGraph: {
    type: 'website',
    siteName: 'Yebaam',
    title: 'Yebaam - Conecta con el mundo',
    description: siteDescription,
    url: siteUrl,
    locale: 'es_CO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yebaam - Conecta con el mundo',
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const themeInitScript = `(function(){try{var p=JSON.parse(localStorage.getItem('yebaam.preferences')||'null');var t=p&&p.state&&p.state.theme;var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale} className={poppins.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-gray-50 text-neutral-900 antialiased dark:bg-neutral-900 dark:text-neutral-100">
        <ErrorBoundary>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeSync />
            <AuthProvider>
              <SocketProvider>
                <OfflineIndicator />
                <div className="min-w-0">{children}</div>
                <Toaster position="top-center" richColors />
              </SocketProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
