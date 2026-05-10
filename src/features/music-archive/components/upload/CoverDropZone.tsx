'use client';

import { useEffect, useState } from 'react';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className={fileInputCls}
      />
      {showPreview && previewUrl && (
        <img
          src={previewUrl}
          alt="Vista previa"
          className="mt-2 h-24 w-24 rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
        />
      )}
    </div>
  );
}
