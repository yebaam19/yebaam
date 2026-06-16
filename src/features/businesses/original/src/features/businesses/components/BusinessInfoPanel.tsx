import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'

export interface BusinessInfoPanelProps {
  address?: string
  phone?: string
  schedule?: string
  deliveryTime?: string
  categories?: string[]
  paymentMethods?: string[]
  notes?: string
}

export default function BusinessInfoPanel({
  address,
  phone,
  schedule,
  deliveryTime,
  categories = [],
  paymentMethods = [],
  notes,
}: BusinessInfoPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos útiles del negocio</CardTitle>
        <CardDescription>
          Información práctica para ubicarlo, contactarlo y decidir con confianza.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {address && (
            <InfoItem label="Dirección" value={address} icon="📍" />
          )}
          {phone && <InfoItem label="Contacto" value={phone} icon="📞" />}
          {schedule && <InfoItem label="Horario" value={schedule} icon="🕒" />}
          {deliveryTime && (
            <InfoItem label="Tiempo estimado" value={deliveryTime} icon="⏱" />
          )}
        </div>

        {categories.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">
              Especialidades
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {paymentMethods.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">
              Métodos de pago
            </p>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {notes && (
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Dato útil</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  )
}
