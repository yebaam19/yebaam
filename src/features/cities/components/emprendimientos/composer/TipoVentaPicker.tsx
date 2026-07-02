'use client';

import { useTranslations } from 'next-intl';
import {
  EMPRENDIMIENTO_CATEGORIES,
  type EmprendimientoCategory,
} from '@/features/cities/data/emprendimientos';

interface Props {
  value: EmprendimientoCategory;
  onChange: (next: EmprendimientoCategory) => void;
  disabled?: boolean;
}

/**
 * "Tipo de venta" as big tappable radio cards (no <select>) — friendlier for
 * the informal-vendor audience. Native radios kept in the DOM (sr-only) so
 * keyboard and screen-reader semantics come for free.
 */
export function TipoVentaPicker({ value, onChange, disabled }: Props) {
  const t = useTranslations('cities.emprendimientos');
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
        {t('composer.fields.categoryLabel')}
      </legend>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {EMPRENDIMIENTO_CATEGORIES.map((category) => {
          const selected = value === category;
          return (
            <label
              key={category}
              className={
                selected
                  ? 'flex min-h-[56px] cursor-pointer items-center justify-center rounded-xl border-2 border-primary-600 bg-primary-50 p-3 text-sm font-semibold text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'flex min-h-[56px] cursor-pointer items-center justify-center rounded-xl border-2 border-neutral-200 bg-white p-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary-300 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200'
              }
            >
              <input
                type="radio"
                name="tipo-venta"
                value={category}
                checked={selected}
                onChange={() => onChange(category)}
                disabled={disabled}
                className="sr-only"
              />
              {t(`categories.${category}`)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
