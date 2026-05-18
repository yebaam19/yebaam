'use client';

import Input from '@/ui/Input';
import { useTranslations } from 'next-intl';
import type { UseEditServiceForm } from './useEditServiceForm';

interface Props {
  fields: Pick<UseEditServiceForm['fields'], 'email' | 'phone' | 'website' | 'address'>;
  setters: Pick<
    UseEditServiceForm['setters'],
    'setEmail' | 'setPhone' | 'setWebsite' | 'setAddress'
  >;
}

export function ContactTab({ fields, setters }: Props) {
  const t = useTranslations('professional.services.editModal');
  return (
    <div className="space-y-4 py-4">
      <h3 className="text-lg font-medium">{t('contact.heading')}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('contact.emailLabel')}
          </label>
          <Input
            type="email"
            value={fields.email}
            onChange={(e) => setters.setEmail(e.target.value)}
            placeholder={t('contact.emailPlaceholder')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('contact.phoneLabel')}
          </label>
          <Input
            type="tel"
            value={fields.phone}
            onChange={(e) => setters.setPhone(e.target.value)}
            placeholder={t('contact.phonePlaceholder')}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('contact.websiteLabel')}
        </label>
        <Input
          type="url"
          value={fields.website}
          onChange={(e) => setters.setWebsite(e.target.value)}
          placeholder={t('contact.websitePlaceholder')}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('contact.addressLabel')}
        </label>
        <Input
          type="text"
          value={fields.address}
          onChange={(e) => setters.setAddress(e.target.value)}
          placeholder={t('contact.addressPlaceholder')}
        />
      </div>
    </div>
  );
}
