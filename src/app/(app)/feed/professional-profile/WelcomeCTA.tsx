'use client';

import { useState } from 'react';

import { CreateProfileDialog } from '@/features/professional-profile/components/welcome/CreateProfileDialog';

export function WelcomeCTA() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <section className="text-center">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-lg sm:p-8 dark:bg-neutral-800">
        <h3 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">¿Listo para comenzar?</h3>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          Crea tu perfil profesional y empieza a destacar tus habilidades y experiencia ante la comunidad.
        </p>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="w-full rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 sm:w-auto"
        >
          Crear mi perfil profesional
        </button>
      </div>

      <CreateProfileDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </section>
  );
}
