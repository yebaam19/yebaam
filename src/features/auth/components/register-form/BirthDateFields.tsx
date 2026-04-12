interface BirthDateFieldsProps {
  birthDay: string
  birthMonth: string
  birthYear: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export function BirthDateFields({ birthDay, birthMonth, birthYear, onChange }: BirthDateFieldsProps) {
  const currentYear = new Date().getFullYear()

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-600">Fecha de nacimiento</label>
      <div className="grid grid-cols-3 gap-3">
        <select
          name="birthDay"
          value={birthDay}
          onChange={onChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        >
          <option value="">Día</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <select
          name="birthMonth"
          value={birthMonth}
          onChange={onChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        >
          <option value="">Mes</option>
          <option value="1">enero</option>
          <option value="2">febrero</option>
          <option value="3">marzo</option>
          <option value="4">abril</option>
          <option value="5">mayo</option>
          <option value="6">junio</option>
          <option value="7">julio</option>
          <option value="8">agosto</option>
          <option value="9">septiembre</option>
          <option value="10">octubre</option>
          <option value="11">noviembre</option>
          <option value="12">diciembre</option>
        </select>

        <select
          name="birthYear"
          value={birthYear}
          onChange={onChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        >
          <option value="">Año</option>
          {Array.from({ length: 100 }, (_, i) => currentYear - i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
