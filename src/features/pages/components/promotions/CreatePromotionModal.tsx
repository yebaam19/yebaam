import { FC, Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, CloudArrowUpIcon } from '@/components/icons/heroicons-shim';
import { useCreatePromotion, useUpdatePromotion } from '../../hooks/usePagePromotions';
import { PagePromotion, PromotionType, CreatePromotionInput } from '../../interfaces/page-promotion.interface';
import Image from 'next/image';

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
  const isEditMode = !!promotion;
  const createMutation = useCreatePromotion(pageId);
  const updateMutation = useUpdatePromotion(pageId, promotion?.id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
      
      // Set existing image preview
      if (promotion.imageUrl) {
        setPreviewUrl(promotion.imageUrl);
      }
    }
  }, [promotion]);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('La imagen no debe superar los 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (formData.value <= 0) {
      newErrors.value = 'El valor debe ser mayor a 0';
    }

    if (formData.type === PromotionType.PERCENTAGE && formData.value > 100) {
      newErrors.value = 'El porcentaje no puede ser mayor a 100';
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (formData.code && formData.code.length < 3) {
      newErrors.code = 'El código debe tener al menos 3 caracteres';
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
      alert(`Error: ${error.response?.data?.message || 'No se pudo guardar la promoción'}`);
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
        return 'Porcentaje de descuento (%)';
      case PromotionType.FIXED:
        return 'Monto de descuento ($)';
      case PromotionType.BOGO:
        return 'Cantidad (ej: 2 para 2x1)';
      default:
        return 'Valor';
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
                    {isEditMode ? 'Editar Promoción' : 'Nueva Promoción'}
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
                      Título *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="ej: 2x1 en Croissants"
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
                      Descripción *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe los detalles de la promoción..."
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
                        Tipo *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value={PromotionType.PERCENTAGE}>Descuento %</option>
                        <option value={PromotionType.FIXED}>Descuento fijo</option>
                        <option value={PromotionType.BOGO}>2x1 / 3x2</option>
                        <option value={PromotionType.FREE_SHIPPING}>Envío gratis</option>
                        <option value={PromotionType.BUNDLE}>Paquete especial</option>
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
                      Código promocional (opcional)
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                      placeholder="VERANO2025"
                      maxLength={20}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Solo letras mayúsculas y números. Ej: VERANO2025
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
                        Fecha de inicio *
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
                        Fecha de fin *
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

                  {/* Image Upload - TODO: Implementar upload a S3 */}
                  {/* 
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Imagen de la promoción (opcional)
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      La funcionalidad de subir imágenes estará disponible próximamente
                    </p>
                  </div>
                  */}

                  {/* Usage Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Límite de usos (opcional)
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit || ''}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Dejar vacío para ilimitado"
                    />
                  </div>

                  {/* Terms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Términos y condiciones (opcional)
                    </label>
                    <textarea
                      name="terms"
                      value={formData.terms}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Términos y condiciones aplicables..."
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
                        Activar promoción inmediatamente
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
                        Destacar promoción ⭐
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
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? 'Guardando...'
                        : isEditMode
                        ? 'Actualizar'
                        : 'Crear promoción'}
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
