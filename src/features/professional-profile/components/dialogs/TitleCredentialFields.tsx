import Input from '@/ui/Input'
import { useTranslations } from 'next-intl'
import { Controller, type Control } from 'react-hook-form'
import type { TitleFormData } from '../../interfaces/professional-profile.interfaces'
import { CATEGORY_OPTIONS, DISTINCTION_OPTIONS, categoryLabel, distinctionLabel } from '../../lib/credentials'

export function TitleCredentialFields({ control }: { control: Control<TitleFormData> }) {
  const t = useTranslations('professional.dialogs.title')
  const tc = useTranslations('professional.dialogs.common')
  return <>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {t('categoryLabel')}
                  </label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <select
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        <option value="">{t('categorySelect')}</option>
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {categoryLabel(c)}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {t('nameLabel')}
                  </label>
                  <Controller
                    control={control}
                    name="name"
                    rules={{ required: tc('requiredField') }}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder={t('namePlaceholder')}
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {t('distinctionLabel')} <span className="text-xs text-neutral-500">{t('distinctionOptional')}</span>
                  </label>
                  <Controller
                    control={control}
                    name="distinction"
                    render={({ field }) => (
                      <select
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        <option value="">{t('distinctionNone')}</option>
                        {DISTINCTION_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {distinctionLabel(d)}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('institutionLabel')}</label>
                  <Controller
                    control={control}
                    name="institution"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder={t('institutionPlaceholder')}
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('yearLabel')}</label>
                  <Controller
                    control={control}
                    name="year"
                    rules={{
                      min: { value: 1900, message: tc('yearMin') },
                      max: { value: new Date().getFullYear() + 10, message: tc('yearMax') },
                    }}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          type="number"
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder={t('yearPlaceholder')}
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

  </>
}
