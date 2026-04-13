import '@/styles/tailwind.css';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import 'rc-slider/assets/index.css';

import { AuthProvider } from '@/features/auth/context/auth-context';
import ThemeProvider from './theme-provider';

import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineIndicator from '@/components/OfflineIndicator';
import { ApolloProvider } from '@/lib/apollo/apollo-provider';
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

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="es" className={poppins.className}>
      <body className="min-h-dvh bg-gray-50 text-neutral-900 antialiased dark:bg-neutral-900 dark:text-neutral-100">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ApolloProvider>
                <SocketProvider>
                  <OfflineIndicator />
                  <div className="min-w-0">{children}</div>
                </SocketProvider>
              </ApolloProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
