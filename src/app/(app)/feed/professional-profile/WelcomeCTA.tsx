'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { CreateProfileDialog } from '@/features/professional-profile/components/welcome/CreateProfileDialog';

export function WelcomeCTA() {
  const t = useTranslations('professional');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <section className="text-center">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-lg sm:p-8 dark:bg-neutral-800">
        <h3 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">{t('welcome.cta.title')}</h3>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          {t('welcome.cta.description')}
        </p>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="w-full rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 sm:w-auto"
        >
          {t('welcome.cta.button')}
        </button>
      </div>

      <CreateProfileDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </section>
  );
}
