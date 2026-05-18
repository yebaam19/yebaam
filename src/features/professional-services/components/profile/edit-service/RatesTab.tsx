'use client';

import Input from '@/ui/Input';
import { useTranslations } from 'next-intl';
import type { UseEditServiceForm } from './useEditServiceForm';

type Fields = UseEditServiceForm['fields'];
type Setters = UseEditServiceForm['setters'];

interface Props {
  fields: Pick<
    Fields,
    'hourlyRate' | 'dailyRate' | 'projectRate' | 'currency' | 'availableForHire' | 'workType'
  >;
  setters: Pick<
    Setters,
    | 'setHourlyRate'
    | 'setDailyRate'
    | 'setProjectRate'
    | 'setCurrency'
    | 'setAvailableForHire'
  >;
  rates: UseEditServiceForm['rates'];
}

export function RatesTab({ fields, setters, rates }: Props) {
  const t = useTranslations('professional.services.editModal');

  const workTypeOptions = [
    { value: 'remote', label: t('rates.workTypes.remote') },
    { value: 'on-site', label: t('rates.workTypes.onSite') },
    { value: 'hybrid', label: t('rates.workTypes.hybrid') },
  ];

  const currencyOptions = [
    { value: 'USD', label: t('rates.currencies.USD') },
    { value: 'EUR', label: t('rates.currencies.EUR') },
    { value: 'COP', label: t('rates.currencies.COP') },
    { value: 'MXN', label: t('rates.currencies.MXN') },
  ];

  const rateRows: Array<{
    key: 'hourly' | 'daily' | 'project';
    label: string;
    value: string;
    onChange: (v: string) => void;
  }> = [
    {
      key: 'hourly',
      label: t('rates.hourlyLabel'),
      value: fields.hourlyRate,
      onChange: setters.setHourlyRate,
    },
    {
      key: 'daily',
      label: t('rates.dailyLabel'),
      value: fields.dailyRate,
      onChange: setters.setDailyRate,
    },
    {
      key: 'project',
      label: t('rates.projectLabel'),
      value: fields.projectRate,
      onChange: setters.setProjectRate,
    },
  ];

  return (
    <div className="space-y-4 py-4">
      <h3 className="text-lg font-medium">{t('rates.heading')}</h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('rates.currencyLabel')}
        </label>
        <select
          value={fields.currency}
          onChange={(e) => setters.setCurrency(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
        >
          {currencyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {rateRows.map((row) => (
          <div key={row.key}>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {row.label}
            </label>
            <Input
              type="number"
              value={row.value}
              onChange={(e) => row.onChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('rates.workTypeLabel')}
        </label>
        <div className="flex flex-wrap gap-3">
          {workTypeOptions.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors ${
                fields.workType.includes(opt.value)
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-800'
              }`}
            >
              <input
                type="checkbox"
                checked={fields.workType.includes(opt.value)}
                onChange={() => rates.toggleWorkType(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="availableForHire"
          checked={fields.availableForHire}
          onChange={(e) => setters.setAvailableForHire(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="availableForHire" className="text-sm text-neutral-700 dark:text-neutral-300">
          {t('rates.availableLabel')}
        </label>
      </div>
    </div>
  );
}
