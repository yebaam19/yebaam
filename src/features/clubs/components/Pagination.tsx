'use client';

import { FC } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/heroicons-shim';

interface PaginationProps {
  totalPages: number;
}

export const Pagination: FC<PaginationProps> = ({ totalPages }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber === 1) {
      params.delete('page');
    } else {
      params.set('page', String(pageNumber));
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const pages = generatePagination(currentPage, totalPages);

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-center gap-1 pt-2"
    >
      <PageArrow
        direction="prev"
        href={createPageURL(currentPage - 1)}
        disabled={currentPage <= 1}
      />
      <ul className="flex items-center gap-1">
        {pages.map((page, idx) => {
          if (page === '…') {
            return (
              <li
                key={`ellipsis-${idx}`}
                className="px-2 text-sm text-neutral-500 dark:text-neutral-400"
                aria-hidden="true"
              >
                …
              </li>
            );
          }
          const isActive = page === currentPage;
          return (
            <li key={page}>
              <Link
                href={createPageURL(page)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Ir a la página ${page}`}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400'
                    : 'border border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300'
                }`}
              >
                {page}
              </Link>
            </li>
          );
        })}
      </ul>
      <PageArrow
        direction="next"
        href={createPageURL(currentPage + 1)}
        disabled={currentPage >= totalPages}
      />
    </nav>
  );
};

interface PageArrowProps {
  direction: 'prev' | 'next';
  href: string;
  disabled: boolean;
}

function PageArrow({ direction, href, disabled }: PageArrowProps) {
  const Icon = direction === 'prev' ? ChevronLeftIcon : ChevronRightIcon;
  const label = direction === 'prev' ? 'Página anterior' : 'Página siguiente';
  const classes =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300';

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-700"
      >
        <Icon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={classes}>
      <Icon className="h-4 w-4" />
    </Link>
  );
}

// Returns [1, '…', 4, 5, 6, '…', totalPages]-style array.
function generatePagination(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '…', total - 1, total];
  if (current >= total - 2) return [1, 2, '…', total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}
