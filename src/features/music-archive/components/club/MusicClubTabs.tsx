'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';

interface Props {
  slug: string;
}

const TABS: Array<{ key: string; label: string; suffix: string }> = [
  { key: 'discos', label: 'Discos', suffix: '' },
  { key: 'posts', label: 'Posts', suffix: '/posts' },
  { key: 'foro', label: 'Foro', suffix: '/foro' },
  { key: 'articulos', label: 'Artículos', suffix: '/articulos' },
  { key: 'artistas', label: 'Artistas', suffix: '/artistas' },
  { key: 'miembros', label: 'Miembros', suffix: '/miembros' },
  { key: 'links', label: 'Enlaces', suffix: '/links' },
  { key: 'reglas', label: 'Reglas', suffix: '/reglas' },
];

/** Horizontal tab strip rendered above each club sub-route. The "Discos" tab
 *  is active when the path is the bare club detail (no suffix). */
export function MusicClubTabs({ slug }: Props) {
  const pathname = usePathname();
  const base = `/musica/clubes/${slug}`;
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => {
          const href = `${base}${t.suffix}`;
          const active =
            t.suffix === ''
              ? pathname === base || pathname === `${base}/`
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={t.key}>
              <Link
                href={href as Route}
                className={
                  'inline-block whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ' +
                  (active
                    ? 'border-amber-600 font-semibold text-zinc-900 dark:border-amber-400 dark:text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200')
                }
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
