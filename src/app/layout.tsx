import '@/styles/tailwind.css';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
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

export const metadata: Metadata = {
  title: {
    template: '%s - Yebaam',
    default: 'Yebaam - Conecta con el mundo',
  },
  description: 'Yebaam es una plataforma social donde puedes conectar, compartir y descubrir contenido con personas de todo el mundo.',
  keywords: ['yebaam', 'red social', 'conectar', 'amigos', 'compartir'],
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
      </body>
    </html>
  );
}
