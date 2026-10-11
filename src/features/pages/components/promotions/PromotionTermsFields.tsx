import { useTranslations } from 'next-intl';
import type { usePromotionForm } from './usePromotionForm';

export function PromotionTermsFields({ form }: { form: ReturnType<typeof usePromotionForm> }) {
  const t = useTranslations('pages.promotions.create');
  const { formData, errors, handleChange, handleCheckboxChange, handleDateChange } = form;
  return <>
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('startDateLabel')}
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate.toISOString().slice(0, 16)}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('endDateLabel')}
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate.toISOString().slice(0, 16)}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.endDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Imagen de la promoción: sin campo por ahora. El backend de
                      promociones no está migrado (POST /api/pages/[id]/promotions
                      responde 501), así que no hay dónde persistirla. Cuando exista
                      soporte end-to-end: subir con uploadService.uploadImage y
                      persistir SOLO el id de Cloudflare (nunca la URL completa). */}

                  {/* Usage Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('usageLimitLabel')}
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit || ''}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('usageLimitPlaceholder')}
                    />
                  </div>

                  {/* Terms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('termsLabel')}
                    </label>
                    <textarea
                      name="terms"
                      value={formData.terms}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={t('termsPlaceholder')}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {t('isActiveLabel')}
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {t('isFeaturedLabel')}
                      </span>
                    </label>
                  </div>

  </>;
}
