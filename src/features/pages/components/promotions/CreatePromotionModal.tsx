import { FC, Fragment, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { useCreatePromotion, useUpdatePromotion } from '../../hooks/usePagePromotions';
import { PagePromotion, PromotionType, CreatePromotionInput } from '../../interfaces/page-promotion.interface';

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  promotion?: PagePromotion; // If provided, edit mode
}

export const CreatePromotionModal: FC<CreatePromotionModalProps> = ({
  isOpen,
  onClose,
  pageId,
  promotion,
}) => {
  const t = useTranslations('pages.promotions.create');
  const isEditMode = !!promotion;
  const createMutation = useCreatePromotion(pageId);
  const updateMutation = useUpdatePromotion(pageId, promotion?.id || '');

  // Form state
  const [formData, setFormData] = useState<CreatePromotionInput>({
    title: '',
    description: '',
    type: PromotionType.PERCENTAGE,
    value: 0,
    code: '',
    startDate: new Date(),
    endDate: new Date(),
    terms: '',
    isActive: true,
    isFeatured: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with promotion data in edit mode
  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title,
        description: promotion.description,
        type: promotion.type,
        value: promotion.value,
        code: promotion.code || '',
        startDate: new Date(promotion.startDate),
        endDate: new Date(promotion.endDate),
        terms: promotion.terms || '',
        isActive: promotion.isActive,
        isFeatured: promotion.isFeatured,
        usageLimit: promotion.usageLimit || undefined,
      });
    }
  }, [promotion]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'number') {
      // Si el valor está vacío, usar 0 en lugar de NaN
      processedValue = value === '' ? 0 : parseFloat(value);
      // Si sigue siendo NaN después de parseFloat, usar 0
      if (isNaN(processedValue)) {
        processedValue = 0;
      }
    } else if (name === 'code') {
      // Para el código: solo mayúsculas y números
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: new Date(value),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.titleRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('validation.descriptionRequired');
    }

    if (formData.value <= 0) {
      newErrors.value = t('validation.valueGreaterThanZero');
    }

    if (formData.type === PromotionType.PERCENTAGE && formData.value > 100) {
      newErrors.value = t('validation.percentageMax');
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = t('validation.endDateAfterStart');
    }

    if (formData.code && formData.code.length < 3) {
      newErrors.code = t('validation.codeMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      // Limpiar y preparar los datos
      const payload: CreatePromotionInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        value: formData.value,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.code && formData.code.trim()) {
        payload.code = formData.code.trim().toUpperCase();
      }

      if (formData.terms && formData.terms.trim()) {
        payload.terms = formData.terms.trim();
      }

      if (formData.usageLimit && formData.usageLimit > 0) {
        payload.usageLimit = formData.usageLimit;
      }

      console.log('Sending promotion payload:', payload);

      if (isEditMode) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error saving promotion:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error: ${error.response?.data?.message || t('validation.saveError')}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: PromotionType.PERCENTAGE,
      value: 0,
      code: '',
      startDate: new Date(),
      endDate: new Date(),
      terms: '',
      isActive: true,
      isFeatured: false,
    });
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    if (!isEditMode) {
      resetForm();
    }
  };

  const getValueLabel = () => {
    switch (formData.type) {
      case PromotionType.PERCENTAGE:
        return t('valueLabel.PERCENTAGE');
      case PromotionType.FIXED:
        return t('valueLabel.FIXED');
      case PromotionType.BOGO:
        return t('valueLabel.BOGO');
      default:
        return t('valueLabel.DEFAULT');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    {isEditMode ? t('titleEdit') : t('titleCreate')}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? t('saving')
                        : isEditMode
                        ? t('update')
                        : t('create')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
