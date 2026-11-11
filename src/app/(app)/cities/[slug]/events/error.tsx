'use client'

import { primaryActionStyles } from '@/ui/primary-action-styles'

export default function EventsError({ reset }: { reset: () => void }) {
  return <section className="space-y-4 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
    <h1 className="text-xl font-semibold">No pudimos cargar los eventos</h1>
    <p role="alert" className="text-sm text-neutral-500">Puede ser un problema temporal de conexión. Inténtalo de nuevo.</p>
    <button type="button" onClick={reset} className={`${primaryActionStyles} px-4`}>Reintentar</button>
  </section>
}
