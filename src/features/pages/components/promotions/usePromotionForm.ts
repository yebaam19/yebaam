import { pageErrorMessage } from '../../utils/pageErrorMessage';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCreatePromotion, useUpdatePromotion } from '../../hooks/usePagePromotions';
import { type PagePromotion, PromotionType, type CreatePromotionInput } from '../../interfaces/page-promotion.interface';

export function usePromotionForm(pageId: string, onClose: () => void, promotion?: PagePromotion) {
  const t = useTranslations('pages.promotions.create');
  const isEditMode = !!promotion;
  const createMutation = useCreatePromotion(pageId);
  const updateMutation = useUpdatePromotion(pageId, promotion?.id || '');

  // Form state
  const [formData, setFormData] = useState<CreatePromotionInput>(() => promotion ? {
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
      } : {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number = value;
    
    if (type === 'number') {
      // Si el valor está vacío, usar 0 en lugar de NaN
      processedValue = value === '' ? 0 : parseFloat(value);
      // Si sigue siendo NaN después de parseFloat, usar 0
      if (Number.isNaN(processedValue)) {
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
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert(`Error: ${pageErrorMessage(error, t('validation.saveError'))}`);
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

  return {
    isEditMode,
    createMutation,
    updateMutation,
    formData,
    errors,
    handleChange,
    handleCheckboxChange,
    handleDateChange,
    handleSubmit,
    handleClose,
    getValueLabel
  };
}
