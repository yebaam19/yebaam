'use client'

import { useTranslations } from 'next-intl'

interface BirthDateFieldsProps {
  birthDay: string
  birthMonth: string
  birthYear: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export function BirthDateFields({ birthDay, birthMonth, birthYear, onChange }: BirthDateFieldsProps) {
  const t = useTranslations('auth')
  const currentYear = new Date().getFullYear()
  const months: Array<{ value: string; key: string }> = [
    { value: '1', key: 'signup.months.1' },
    { value: '2', key: 'signup.months.2' },
    { value: '3', key: 'signup.months.3' },
    { value: '4', key: 'signup.months.4' },
    { value: '5', key: 'signup.months.5' },
    { value: '6', key: 'signup.months.6' },
    { value: '7', key: 'signup.months.7' },
    { value: '8', key: 'signup.months.8' },
    { value: '9', key: 'signup.months.9' },
    { value: '10', key: 'signup.months.10' },
    { value: '11', key: 'signup.months.11' },
    { value: '12', key: 'signup.months.12' },
  ]

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-600">{t('signup.birthDateLabel')}</label>
      <div className="grid grid-cols-3 gap-3">
        <select
          name="birthDay"
          value={birthDay}
          onChange={onChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none sm:px-3"
        >
          <option value="">{t('signup.dayPlaceholder')}</option>
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
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none sm:px-3"
        >
          <option value="">{t('signup.monthPlaceholder')}</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {t(m.key as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>

        <select
          name="birthYear"
          value={birthYear}
          onChange={onChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none sm:px-3"
        >
          <option value="">{t('signup.yearPlaceholder')}</option>
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
