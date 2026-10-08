'use client';

import { useTranslations } from 'next-intl';
import Input from '@/ui/Input';
import type { CommunityAbout } from '../../types/communityAbout.types';

export function AboutContactFields({ about, name }: { about: CommunityAbout | null; name: string }) {
  const t = useTranslations('communities.about');
  return <div className="space-y-4">
    <p className="text-sm"><span className="text-neutral-600 dark:text-neutral-300">{t('officialName')}: </span>{name}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">{t('foundedOn')}
        <Input name="foundedOn" type="date" defaultValue={about?.founded_on ?? ''} className="mt-2" />
      </label>
      <label className="block text-sm font-medium">{t('location')}
        <Input name="location" maxLength={200} defaultValue={about?.location ?? ''} className="mt-2" />
      </label>
      <label className="block text-sm font-medium">{t('contactEmail')}
        <Input name="contactEmail" type="email" maxLength={254} defaultValue={about?.contact_email ?? ''} className="mt-2" />
      </label>
      <label className="block text-sm font-medium">{t('contactPhone')}
        <Input name="contactPhone" type="tel" maxLength={40} defaultValue={about?.contact_phone ?? ''} className="mt-2" />
      </label>
    </div>
    <label className="block text-sm font-medium">{t('website')}
      <Input name="website" type="url" maxLength={2000} placeholder="https://" defaultValue={about?.website ?? ''} className="mt-2" />
    </label>
  </div>;
}
