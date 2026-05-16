'use client';

import { useTranslations } from 'next-intl';
import { OCCUPATIONS } from '../../constants/occupations';

interface OccupationFieldProps {
  occupation: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function OccupationField({ occupation, onChange }: OccupationFieldProps) {
  const t = useTranslations('auth');
  return (
    <div>
      <label htmlFor="occupation" className="block text-xs font-medium text-gray-600 mb-2">
        {t('signup.occupationLabel')}
      </label>
      <select
        id="occupation"
        name="occupation"
        value={occupation}
        onChange={onChange}
        required
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
      >
        <option value="" disabled>
          {t('signup.occupationPlaceholder')}
        </option>
        {OCCUPATIONS.map(({ slug, label }) => (
          <option key={slug} value={slug}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
