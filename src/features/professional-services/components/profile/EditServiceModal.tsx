'use client';

/**
 * EditServiceModal — orchestration shell.
 *
 * The form state, image-upload pipeline, and submit handler live in
 * `useEditServiceForm`. Per-tab UI lives under `./edit-service/`. This file
 * is intentionally small: modal frame, success/error banners, tab routing,
 * footer buttons. Add a tab = drop a file in `./edit-service/`, add a
 * `<TabsTrigger>` here, and render it inside a new `<TabsContent>`.
 */

import ButtonPrimary from '@/ui/ButtonPrimary';
import ButtonSecondary from '@/ui/ButtonSecondary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';
import { FEATURE_FLAGS } from '@/config/features-flag';
import type { ProfessionalService } from '../../interfaces/professional-service.interfaces';
import { BasicInfoTab } from './edit-service/BasicInfoTab';
import { ContactTab } from './edit-service/ContactTab';
import { CvTab } from './edit-service/CvTab';
import { ImagesTab } from './edit-service/ImagesTab';
import { ProjectsTab } from './edit-service/ProjectsTab';
import { RatesTab } from './edit-service/RatesTab';
import { SocialTab } from './edit-service/SocialTab';
import { useEditServiceForm } from './edit-service/useEditServiceForm';

interface EditServiceModalProps {
  service: ProfessionalService;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditServiceModal({ service, open, onOpenChange }: EditServiceModalProps) {
  const t = useTranslations('professional.services.editModal');
  const form = useEditServiceForm(service, onOpenChange);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onOpenChange} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              <header className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t('title')}</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </header>

              {form.status.saveSuccess && <SuccessBanner message={t('saveSuccess')} />}
              {form.status.error && <ErrorBanner message={form.status.error} />}

              <form onSubmit={form.handleSubmit}>
                <Tabs>
                  <TabsList className="w-full">
                    <TabsTrigger>{t('tabs.images')}</TabsTrigger>
                    <TabsTrigger>{t('tabs.info')}</TabsTrigger>
                    <TabsTrigger>{t('tabs.contact')}</TabsTrigger>
                    <TabsTrigger>{t('tabs.social')}</TabsTrigger>
                    <TabsTrigger>{t('tabs.rates')}</TabsTrigger>
                    {FEATURE_FLAGS.SERVICES_CV_UPLOAD && <TabsTrigger>{t('tabs.cv')}</TabsTrigger>}
                    {FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO && (
                      <TabsTrigger>{t('tabs.projects')}</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent>
                    <ImagesTab images={form.images} uploads={form.uploads} />
                  </TabsContent>
                  <TabsContent>
                    <BasicInfoTab fields={form.fields} setters={form.setters} />
                  </TabsContent>
                  <TabsContent>
                    <ContactTab fields={form.fields} setters={form.setters} />
                  </TabsContent>
                  <TabsContent>
                    <SocialTab fields={form.fields} setters={form.setters} />
                  </TabsContent>
                  <TabsContent>
                    <RatesTab fields={form.fields} setters={form.setters} rates={form.rates} />
                  </TabsContent>
                  {FEATURE_FLAGS.SERVICES_CV_UPLOAD && (
                    <TabsContent>
                      <CvTab cv={form.cv} upload={form.uploads.cv} />
                    </TabsContent>
                  )}
                  {FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO && (
                    <TabsContent>
                      <ProjectsTab portfolio={form.portfolio} />
                    </TabsContent>
                  )}
                </Tabs>

                <footer className="flex justify-end gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-700">
                  <ButtonSecondary
                    type="button"
                    onClick={() => onOpenChange(false)}
                    disabled={form.status.isBusy}
                  >
                    {t('cancel')}
                  </ButtonSecondary>
                  <ButtonPrimary type="submit" disabled={form.status.isBusy}>
                    {form.status.isBusy ? t('saving') : t('save')}
                  </ButtonPrimary>
                </footer>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm font-medium text-green-800 dark:text-green-200">{message}</p>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <p className="text-sm font-medium text-red-800 dark:text-red-200">{message}</p>
      </div>
    </div>
  );
}
