'use client';

import { imageUrl } from '@/lib/media/urls';
import { CoverDropZone } from '../../upload/CoverDropZone';

/** Renders a labeled cover slot: the current Cloudflare image (if any) above
 *  the file picker that uploads its replacement. */
export function CoverField({
  label,
  currentId,
  file,
  onChange,
}: {
  label: string;
  currentId: string | null;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      {currentId && !file && (
        <img
          src={imageUrl(currentId, 'thumbnail')}
          alt=""
          className="mb-2 h-20 w-20 rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
        />
      )}
      <CoverDropZone file={file} onChange={onChange} />
    </div>
  );
}
