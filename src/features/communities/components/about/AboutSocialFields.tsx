'use client';

import { useTranslations } from 'next-intl';
import Input from '@/ui/Input';
import { Button } from '@/ui/Button';
import type { AboutLink } from '../../types/communityAbout.types';

export function AboutSocialFields({ links, onChange }: { links: AboutLink[]; onChange: (links: AboutLink[]) => void }) {
  const t = useTranslations('communities.about');
  return <div className="space-y-3">
    <h4 className="text-sm font-semibold">{t('socialLinks')}</h4>
    {links.map((link, index) => <div key={index} className="flex flex-wrap items-end gap-2">
      <label className="min-w-32 flex-1 text-sm">{t('linkLabel', { number: index + 1 })}
        <Input required value={link.label} maxLength={80} onChange={(event) => onChange(links.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} />
      </label>
      <label className="min-w-40 flex-2 text-sm">{t('linkUrl', { number: index + 1 })}
        <Input required type="url" value={link.url} maxLength={2000} placeholder="https://"
          onChange={(event) => onChange(links.map((item, i) => i === index ? { ...item, url: event.target.value } : item))} />
      </label>
      <Button type="button" plain aria-label={t('removeLink', { number: index + 1 })}
        onClick={() => onChange(links.filter((_, i) => i !== index))}>{t('remove')}</Button>
    </div>)}
    {links.length < 10 && <Button type="button" outline onClick={() => onChange([...links, { label: '', url: '' }])}>{t('addLink')}</Button>}
  </div>;
}
