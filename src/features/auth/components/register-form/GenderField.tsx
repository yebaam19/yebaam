'use client';

import { useTranslations } from 'next-intl';

interface GenderFieldProps {
  gender: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GenderField({ gender, onChange }: GenderFieldProps) {
  const t = useTranslations('auth');
  const genderOptions = [
    { value: 'female', label: t('signup.genderFemale') },
    { value: 'male', label: t('signup.genderMale') },
    { value: 'other', label: t('signup.genderOther') }
  ];

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">
        {t('signup.genderLabel')}
      </label>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {genderOptions.map(({ value, label }) => {
          const selected = gender === value;
          return (
            <label
              key={value}
              className={`relative flex items-center justify-center rounded-lg border-2 px-2 py-3 cursor-pointer transition-all sm:px-4 ${
                selected
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
              <input
                type="radio"
                name="gender"
                value={value}
                checked={selected}
                onChange={onChange}
                className="sr-only"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
