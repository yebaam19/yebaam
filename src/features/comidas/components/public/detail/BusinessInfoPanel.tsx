export interface BusinessInfoPanelProps {
  address?: string
  phone?: string
  schedule?: string
  deliveryTime?: string
  categories?: string[]
  paymentMethods?: string[]
  notes?: string
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-sm font-semibold text-neutral-900">{icon} {label}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{value}</p>
    </div>
  )
}

export function BusinessInfoPanel({
  address,
  phone,
  schedule,
  deliveryTime,
  categories = [],
  paymentMethods = [],
  notes,
}: BusinessInfoPanelProps) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm">
      <div className="px-5 pt-5 pb-1">
        <h3 className="text-lg font-semibold text-neutral-950">Datos útiles del negocio</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Información práctica para ubicarlo, contactarlo y decidir con confianza.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {address && <InfoItem label="Dirección" value={address} icon="📍" />}
          {phone && <InfoItem label="Contacto" value={phone} icon="📞" />}
          {schedule && <InfoItem label="Horario" value={schedule} icon="🕒" />}
          {deliveryTime && <InfoItem label="Tiempo estimado" value={deliveryTime} icon="⏱" />}
        </div>

        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-neutral-900">Especialidades</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <span key={item} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {paymentMethods.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-neutral-900">Métodos de pago</p>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((item) => (
                <span key={item} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {notes && (
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm font-semibold text-neutral-900">Dato útil</p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">{notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
