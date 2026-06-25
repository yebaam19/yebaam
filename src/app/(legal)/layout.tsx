import { type FC, type ReactNode } from 'react';
import Link from 'next/link';

import LanguageSwitch from '@/components/settings/LanguageSwitch';
import { LegalFooter } from '@/components/legal/LegalFooter';

interface Props {
  children?: ReactNode;
}

/**
 * Public, standalone layout for the /normativa legal pages. Minimal chrome
 * (wordmark → home + language switch) and a normal scrollable document flow so
 * browser scroll + heading anchors work. Viewable logged-out and logged-in.
 */
const LegalLayout: FC<Props> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-primary-600 dark:text-primary-400"
          >
            YEBAAM
          </Link>
          <LanguageSwitch className="border-neutral-300/80 bg-white/90 shadow-sm dark:border-neutral-600 dark:bg-neutral-900/90" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">{children}</main>

      <LegalFooter />
    </div>
  );
};

export default LegalLayout;
