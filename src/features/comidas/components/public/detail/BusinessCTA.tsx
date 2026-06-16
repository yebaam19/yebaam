export interface BusinessCTAProps {
  title?: string
  description?: string
  primaryLabel?: string
  secondaryLabel?: string
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
  sticky?: boolean
}

export function BusinessCTA({
  title = '¿Listo para pedir o preguntar?',
  description = 'Abre el canal directo del negocio para resolver dudas o hacer tu pedido.',
  primaryLabel = 'Pedir por WhatsApp',
  secondaryLabel = 'Ver carta',
  onPrimaryClick,
  onSecondaryClick,
  sticky = false,
}: BusinessCTAProps) {
  return (
    <div className={sticky ? 'lg:sticky lg:top-24' : ''}>
      <div className="overflow-hidden rounded-[1.75rem] border border-orange-200 bg-orange-50 p-5">
        <div>
          <h3 className="text-xl font-semibold text-neutral-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onPrimaryClick}
            className="w-full rounded-2xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-800"
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={onSecondaryClick}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            {secondaryLabel}
          </button>
        </div>
        <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-neutral-600">
          Contacto simple para pasar del antojo a la acción.
        </div>
      </div>
    </div>
  )
}
