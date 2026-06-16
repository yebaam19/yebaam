function InfoItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-sm font-semibold text-neutral-900">{icon} {label}</p>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{value}</p>
    </div>
  )
}

export interface ProductInfoPanelProps {
  description?: string | null
  ingredients?: string[]
  notes?: string | null
  preparationTime?: string | null
  category?: string | null
  availabilityLabel?: string
  tags?: string[]
}

export function ProductInfoPanel({
  description,
  ingredients = [],
  notes,
  preparationTime,
  category,
  availabilityLabel,
  tags = [],
}: ProductInfoPanelProps) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm">
      <div className="px-5 pt-5 pb-1">
        <h3 className="text-lg font-semibold text-neutral-950">Detalles para decidir</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Ingredientes, disponibilidad y contexto para elegir con más confianza.
        </p>
      </div>

      <div className="space-y-6 p-5">
        {description && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Qué vas a encontrar</h4>
            <p className="mt-2 text-sm leading-7 text-neutral-600">{description}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {category && <InfoItem label="Categoría" value={category} icon="🍔" />}
          {preparationTime && <InfoItem label="Tiempo estimado" value={preparationTime} icon="⏱" />}
          {availabilityLabel && <InfoItem label="Estado" value={availabilityLabel} icon="✅" />}
        </div>

        {ingredients.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Ingredientes</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {ingredients.map((ingredient) => (
                <span key={ingredient} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600">
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">Señales destacadas</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {notes && (
          <div className="rounded-2xl bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-neutral-900">Dato útil</h4>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
