'use client'

interface FilterSelectOption {
  id: string
  name: string
}

interface FilterSelectProps {
  id: string
  label: string
  /** Etiqueta de la opción "todas" (valor vacío). */
  allLabel: string
  value: string
  options: FilterSelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

/** Select etiquetado de la barra de filtros (departamento / ciudad / categoría). */
export function FilterSelect({ id, label, allLabel, value, options, onChange, disabled }: FilterSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        disabled={disabled}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}
