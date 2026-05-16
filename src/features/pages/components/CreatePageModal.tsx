'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { usePagesUIStore } from '../store/pagesUI.store';
import { useCreatePage } from '../hooks/usePages';

import type { CreatePageDto } from '../types/page.types';
import { useRouter } from 'next/navigation';
import {
  CreatePageStep1,
  CreatePageStep2,
  CreatePageStep3,
  CreatePageStep4,
} from './create-page';

export const CreatePageModal = () => {
  const t = useTranslations('pages.createModal');
  const router = useRouter();
  const { isCreateModalOpen, closeCreateModal } = usePagesUIStore();
  const createMutation = useCreatePage();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreatePageDto>>({
    privacy: 'public', // Backend usa 'public' en minúscula
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUpdateData = (data: Partial<CreatePageDto>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    try {
      const page = await createMutation.mutateAsync(formData as CreatePageDto);
      closeCreateModal();
      resetModal();
      // Navegar a la página recién creada usando el slug
      router.push(`/feed/paginas/${page.slug}`);
    } catch (error) {
      console.error('Error creating page:', error);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setFormData({ privacy: 'public' });
  };

  const handleClose = () => {
    closeCreateModal();
    // Reset después de la animación de cierre
    setTimeout(resetModal, 300);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return t('step1Title');
      case 2:
        return t('step2Title');
      case 3:
        return t('step3Title');
      case 4:
        return t('step4Title');
      default:
        return t('title');
    }
  };

  return (
    <Transition appear show={isCreateModalOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold text-gray-900 dark:text-white"
                    >
                      {t('title')}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {t('stepLabel', { title: getStepTitle(), current: currentStep, total: totalSteps })}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900">
                  <div className="flex gap-2">
                    {[...Array(totalSteps)].map((_, index) => (
                      <div
                        key={index}
                        className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                          index + 1 <= currentStep
                            ? 'bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                  {currentStep === 1 && (
                    <CreatePageStep1
                      data={formData}
                      onUpdate={handleUpdateData}
                      onNext={handleNext}
                    />
                  )}
                  {currentStep === 2 && (
                    <CreatePageStep2
                      data={formData}
                      onUpdate={handleUpdateData}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                  {currentStep === 3 && (
                    <CreatePageStep3
                      data={formData}
                      onUpdate={handleUpdateData}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                  {currentStep === 4 && (
                    <CreatePageStep4
                      data={formData}
                      onUpdate={handleUpdateData}
                      onBack={handleBack}
                      onSubmit={handleSubmit}
                      isSubmitting={createMutation.isPending}
                    />
                  )}
                </div>

                {/* Error Message */}
                {createMutation.isError && (
                  <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {createMutation.error instanceof Error
                        ? createMutation.error.message
                        : t('errorDefault')}
                    </p>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
