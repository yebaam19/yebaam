'use client';

import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { invalidate } from '@/lib/hooks/cacheStore';
import { Page } from '../../types/page.types';
import { useUpdatePage } from '../../hooks/usePages';
import { BasicInfoFields } from './general/BasicInfoFields';
import { ContactFields } from './general/ContactFields';
import { SocialFields } from './general/SocialFields';
import { buildUpdateDto, formDataFromPage, type GeneralFormData } from './general/form';
import type { SocialKey } from './general/social-networks';

interface SettingsGeneralProps {
  page: Page;
}

/**
 * "Información general" settings shell: owns the form state and the save action.
 * Field groups (basic / contact / social) render and emit changes; this shell
 * persists them via the real `useUpdatePage` mutation (PUT /api/pages/[id]).
 */
export const SettingsGeneral: FC<SettingsGeneralProps> = ({ page }) => {
  const t = useTranslations('pages.settings.general');
  const updatePage = useUpdatePage();
  const [form, setForm] = useState<GeneralFormData>(() => formDataFromPage(page));

  const setField = <K extends keyof GeneralFormData>(key: K, value: GeneralFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setSocial = (key: SocialKey, value: string) =>
    setForm((prev) => ({ ...prev, social: { ...prev.social, [key]: value } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePage.mutateAsync({ pageId: page.id, data: buildUpdateDto(form, page) });
      // Invalida el detalle cacheado (incl. la variante por slug) para que
      // "Acerca de" refleje los cambios al volver.
      invalidate('pages::detail');
      toast.success('Cambios guardados.');
    } catch {
      toast.error('No se pudieron guardar los cambios. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('heading')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('subheading')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoFields form={form} setField={setField} />
        <ContactFields form={form} setField={setField} />
        <SocialFields form={form} setSocial={setSocial} />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={updatePage.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {updatePage.isPending ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
};
