'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { DEFAULT_IMAGE_FRAMING, type ImageFraming } from '../../schemas/communityHeaderImage.schema';

export function ImageFramingControls({ value, onChange, disabled }: {
  value: ImageFraming; onChange: (value: ImageFraming) => void; disabled: boolean;
}) {
  const t = useTranslations('communities.headerImages');
  return <fieldset disabled={disabled} className="space-y-2 disabled:opacity-50">
    <legend className="mb-3 text-sm font-semibold">{t('framing')}</legend>
    {(['x', 'y', 'zoom'] as const).map((key) => <label key={key} className="block text-sm">
      <span className="flex items-center justify-between gap-3"><span>{t(key)}</span>
        <span className="tabular-nums text-neutral-600 dark:text-neutral-300">{key === 'zoom' ? `${value[key].toFixed(2)}×` : `${value[key]}%`}</span>
      </span>
      <input type="range" min={key === 'zoom' ? 1 : 0} max={key === 'zoom' ? 3 : 100}
        step={key === 'zoom' ? 0.05 : 1} value={value[key]} aria-label={t(key)}
        onChange={(event) => onChange({ ...value, [key]: Number(event.target.value) })}
        className="h-9 w-full accent-primary-800 focus-visible:outline-2 focus-visible:outline-primary-800 dark:accent-primary-300 dark:focus-visible:outline-primary-300" />
    </label>)}
    <Button plain onClick={() => onChange(DEFAULT_IMAGE_FRAMING)}>{t('reset')}</Button>
  </fieldset>;
}
