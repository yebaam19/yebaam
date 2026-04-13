'use client';

import { SparklesIcon } from '@/components/icons/heroicons-shim';

export default function SponsoredAd() {
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
      <div className="mb-2 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-neutral-400" />
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Patrocinado
        </span>
      </div>
      <img
        src="https://via.placeholder.com/300x150"
        alt="Sponsored content"
        className="mb-2 w-full rounded-lg"
      />
      <p className="text-sm font-medium text-neutral-900 dark:text-white">
        Descubre nuevas oportunidades
      </p>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        Conecta con profesionales de tu industria
      </p>
    </section>
  );
}
