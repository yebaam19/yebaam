interface GenderFieldProps {
  gender: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GenderField({ gender, onChange }: GenderFieldProps) {
  const genderOptions = [
    { value: 'female', label: 'Mujer' },
    { value: 'male', label: 'Hombre' },
    { value: 'other', label: 'Otro' }
  ];

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        Género
      </label>
      <div className="grid grid-cols-3 gap-3">
        {genderOptions.map(({ value, label }) => (
          <label
            key={value}
            className={`
              relative flex items-center justify-between px-4 py-3 border-2 rounded-lg cursor-pointer transition-all
              ${gender === value
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }
            `}
          >
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <input
              type="radio"
              name="gender"
              value={value}
              checked={gender === value}
              onChange={onChange}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${gender === value ? 'border-green-600' : 'border-gray-400'}`}>
              {gender === value && (
                <div className="w-3 h-3 rounded-full bg-green-600" />
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
