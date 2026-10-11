import { useTranslations } from 'next-intl';
import { PromotionType } from '../../interfaces/page-promotion.interface';
import type { usePromotionForm } from './usePromotionForm';

export function PromotionMainFields({ form }: { form: ReturnType<typeof usePromotionForm> }) {
  const t = useTranslations('pages.promotions.create');
  const { formData, errors, handleChange, getValueLabel } = form;
  return <>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('titleLabel')}
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('titlePlaceholder')}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('descriptionLabel')}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('descriptionPlaceholder')}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Type and Value */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('typeLabel')}
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value={PromotionType.PERCENTAGE}>{t('types.PERCENTAGE')}</option>
                        <option value={PromotionType.FIXED}>{t('types.FIXED')}</option>
                        <option value={PromotionType.BOGO}>{t('types.BOGO')}</option>
                        <option value={PromotionType.FREE_SHIPPING}>{t('types.FREE_SHIPPING')}</option>
                        <option value={PromotionType.BUNDLE}>{t('types.BUNDLE')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {getValueLabel()} *
                      </label>
                      <input
                        type="number"
                        name="value"
                        value={formData.value || ''}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('codeLabel')}
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                      placeholder={t('codePlaceholder')}
                      maxLength={20}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('codeHint')}
                    </p>
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.code}
                      </p>
                    )}
                  </div>

  </>;
}
