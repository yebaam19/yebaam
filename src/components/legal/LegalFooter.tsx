import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/**
 * Small legal footer (Facebook-style) linking the public normativa pages.
 * Server component — rendered in the (legal) and (auth) layouts so it shows on
 * both the legal pages and the login/signup surfaces.
 */
export async function LegalFooter() {
  const t = await getTranslations('legal');

  const links = [
    { href: '/normativa/terminos', label: t('footer.terms') },
    { href: '/normativa/normas-comunitarias', label: t('footer.community') },
    { href: '/normativa/reglamento', label: t('footer.rules') },
  ];

  return (
    <footer className="border-t border-neutral-200 px-4 py-6 text-center dark:border-neutral-800">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs text-neutral-500 transition-colors hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">{t('footer.rights')}</p>
    </footer>
  );
}
