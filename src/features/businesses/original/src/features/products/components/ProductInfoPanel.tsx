import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'

export interface ProductInfoPanelProps {
  description?: string
  ingredients?: string[]
  notes?: string
  preparationTime?: string
  category?: string
  availabilityLabel?: string
  tags?: string[]
}

export default function ProductInfoPanel({
  description,
  ingredients = [],
  notes,
  preparationTime,
  category,
  availabilityLabel,
  tags = [],
}: ProductInfoPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles para decidir</CardTitle>
        <CardDescription>
          Ingredientes, disponibilidad y contexto para elegir con más confianza.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {description && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Qué vas a encontrar
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {description}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {category && (
            <InfoItem label="Categoría" value={category} icon="🍔" />
          )}
          {preparationTime && (
            <InfoItem label="Tiempo estimado" value={preparationTime} icon="⏱" />
          )}
          {availabilityLabel && (
            <InfoItem label="Estado" value={availabilityLabel} icon="✅" />
          )}
        </div>

        {ingredients.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Ingredientes
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {ingredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Señales destacadas
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {notes && (
          <div className="rounded-2xl bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Dato útil</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{notes}</p>
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
