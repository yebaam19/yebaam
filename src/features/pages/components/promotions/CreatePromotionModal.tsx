import { FC, Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { usePromotionForm } from './usePromotionForm';
import { PromotionMainFields } from './PromotionMainFields';
import { PromotionTermsFields } from './PromotionTermsFields';
import { PagePromotion } from '../../interfaces/page-promotion.interface';

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  promotion?: PagePromotion; // If provided, edit mode
}

const CreatePromotionForm: FC<CreatePromotionModalProps> = ({
  isOpen,
  onClose,
  pageId,
  promotion,
}) => {
  const t = useTranslations('pages.promotions.create');
  const form = usePromotionForm(pageId, onClose, promotion);
  const { isEditMode, createMutation, updateMutation, handleSubmit, handleClose } = form;

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
                  <PromotionMainFields form={form} />
                  <PromotionTermsFields form={form} />

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

export const CreatePromotionModal: FC<CreatePromotionModalProps> = (props) =>
  props.isOpen ? <CreatePromotionForm key={props.promotion?.id ?? 'new'} {...props} /> : null;
