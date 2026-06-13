'use client';

import { useTranslations } from 'next-intl';
import { Field, Section } from '../upload/primitives';
import { CoverDropZone } from '../upload/CoverDropZone';

interface Props {
  coverFront: File | null;
  onCoverFrontChange: (file: File | null) => void;
  coverBack: File | null;
  onCoverBackChange: (file: File | null) => void;
  labelImage: File | null;
  onLabelImageChange: (file: File | null) => void;
}

/** Section 3 — the cover image upload slots (front cover required, back cover
 *  and label scan optional). The actual Cloudflare Images upload happens at
 *  submit time in the parent; here we only hold the picked `File`s. */
export function CoverUpload({
  coverFront,
  onCoverFrontChange,
  coverBack,
  onCoverBackChange,
  labelImage,
  onLabelImageChange,
}: Props) {
  const t = useTranslations('musica');

  return (
    <Section title={t('adminUpload.section3Title')} hint={t('adminUpload.section3Hint')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label={t('adminUpload.frontCoverLabel')} required>
          <CoverDropZone file={coverFront} onChange={onCoverFrontChange} />
        </Field>
        <Field label={t('adminUpload.backCoverLabel')}>
          <CoverDropZone file={coverBack} onChange={onCoverBackChange} />
        </Field>
        <Field label={t('adminUpload.labelImageLabel')}>
          <CoverDropZone file={labelImage} onChange={onLabelImageChange} />
        </Field>
      </div>
    </Section>
  );
}
