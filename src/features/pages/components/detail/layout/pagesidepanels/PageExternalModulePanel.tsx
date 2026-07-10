'use client';

import { FC } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

/** Deep-links into platform Chat público / Foro until page-owned rooms exist. */
export const PageExternalModulePanel: FC<{
  title: string;
  description: string;
  href: Route;
  cta: string;
}> = ({ title, description, href, cta }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-3">
    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    <Link
      href={href}
      className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {cta}
    </Link>
  </div>
);
