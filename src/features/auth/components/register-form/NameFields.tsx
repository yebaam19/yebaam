interface NameFieldsProps {
  firstName: string
  lastName: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function NameFields({ firstName, lastName, onChange }: NameFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <input
        type="text"
        name="firstName"
        value={firstName}
        onChange={onChange}
        placeholder="Nombre"
        required
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
      />
      <input
        type="text"
        name="lastName"
        value={lastName}
        onChange={onChange}
        placeholder="Apellido"
        required
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
      />
    </div>
  )
}
