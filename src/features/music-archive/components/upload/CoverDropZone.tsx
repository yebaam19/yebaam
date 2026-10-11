'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { fileInputCls } from './constants';

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  /** Show a square preview thumbnail when a file is selected. Default: true. */
  showPreview?: boolean;
}

/** Image file input with object-URL preview. Used for album front cover, back
 *  cover, label scan, and artist photo. The browser-side preview avoids a
 *  network round-trip — it just shows what the user just dropped. */
export function CoverDropZone({ file, onChange, showPreview = true }: Props) {
  const t = useTranslations('musica');
  const previewRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!file || !showPreview || !previewRef.current) return;
    const url = URL.createObjectURL(file);
    previewRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, showPreview]);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className={fileInputCls}
      />
      {showPreview && file && (
        <img
          ref={previewRef}
          alt={t('upload.previewAlt')}
          className="mt-2 h-24 w-24 rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
          decoding="async"
          loading="lazy"
        />
      )}
    </div>
  );
}
