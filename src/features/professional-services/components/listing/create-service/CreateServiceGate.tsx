import Link from 'next/link'

interface CreateServiceGateProps {
  eligibility: { eligible: boolean; hasProfile: boolean; professionalProfileId: string | null } | null
}

/**
 * PDF rule: only a verified professional profile may publish a service. Shows a
 * spinner until eligibility resolves, then the gate when the user isn't verified.
 * Renders nothing once eligible (the parent then shows the create steps).
 */
export function CreateServiceGate({ eligibility }: CreateServiceGateProps) {
  if (eligibility === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Verificando tu perfil profesional…</p>
      </div>
    )
  }
  if (eligibility.eligible) return null
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-center dark:border-amber-800/60 dark:bg-amber-900/20">
      <h4 className="text-base font-semibold text-amber-900 dark:text-amber-200">
        Solo para perfiles profesionales verificados
      </h4>
      <p className="mx-auto mt-2 max-w-md text-sm text-amber-800 dark:text-amber-300/90">
        {eligibility.hasProfile
          ? 'Para publicar un servicio necesitas autenticar al menos un título o estudio de tu perfil profesional ante la plataforma. La autenticación tiene un costo; abrir el perfil no.'
          : 'Primero crea tu perfil profesional y autentica al menos un título o estudio ante la plataforma. La autenticación tiene un costo; abrir el perfil no.'}
      </p>
      <Link
        href="/feed/professional-profile"
        className="mt-4 inline-flex rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
      >
        {eligibility.hasProfile ? 'Autenticar mis títulos' : 'Crear mi perfil profesional'}
      </Link>
    </div>
  )
}
