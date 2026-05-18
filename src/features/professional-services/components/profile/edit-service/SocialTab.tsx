'use client';

import Input from '@/ui/Input';
import { useTranslations } from 'next-intl';
import type { UseEditServiceForm } from './useEditServiceForm';

type Fields = UseEditServiceForm['fields'];
type Setters = UseEditServiceForm['setters'];

interface Props {
  fields: Pick<
    Fields,
    'facebookUrl' | 'instagramUrl' | 'twitterUrl' | 'linkedinUrl' | 'youtubeUrl' | 'tiktokUrl'
  >;
  setters: Pick<
    Setters,
    | 'setFacebookUrl'
    | 'setInstagramUrl'
    | 'setTwitterUrl'
    | 'setLinkedinUrl'
    | 'setYoutubeUrl'
    | 'setTiktokUrl'
  >;
}

/**
 * 6 social URL inputs in a 2-column grid. The label/key/setter triplet is
 * driven from a tiny config so adding/removing a network is a one-line
 * change — `(t, fields, setters)` produce the 6 rows.
 */
export function SocialTab({ fields, setters }: Props) {
  const t = useTranslations('professional.services.editModal');

  const rows: Array<{
    key: keyof Props['fields'];
    label: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  }> = [
    {
      key: 'facebookUrl',
      label: t('social.facebookLabel'),
      placeholder: t('social.facebookPlaceholder'),
      value: fields.facebookUrl,
      onChange: setters.setFacebookUrl,
    },
    {
      key: 'instagramUrl',
      label: t('social.instagramLabel'),
      placeholder: t('social.instagramPlaceholder'),
      value: fields.instagramUrl,
      onChange: setters.setInstagramUrl,
    },
    {
      key: 'twitterUrl',
      label: t('social.twitterLabel'),
      placeholder: t('social.twitterPlaceholder'),
      value: fields.twitterUrl,
      onChange: setters.setTwitterUrl,
    },
    {
      key: 'linkedinUrl',
      label: t('social.linkedinLabel'),
      placeholder: t('social.linkedinPlaceholder'),
      value: fields.linkedinUrl,
      onChange: setters.setLinkedinUrl,
    },
    {
      key: 'youtubeUrl',
      label: t('social.youtubeLabel'),
      placeholder: t('social.youtubePlaceholder'),
      value: fields.youtubeUrl,
      onChange: setters.setYoutubeUrl,
    },
    {
      key: 'tiktokUrl',
      label: t('social.tiktokLabel'),
      placeholder: t('social.tiktokPlaceholder'),
      value: fields.tiktokUrl,
      onChange: setters.setTiktokUrl,
    },
  ];

  return (
    <div className="space-y-4 py-4">
      <h3 className="text-lg font-medium">{t('social.heading')}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.key}>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {row.label}
            </label>
            <Input
              type="url"
              value={row.value}
              onChange={(e) => row.onChange(e.target.value)}
              placeholder={row.placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
