import { ChangeEvent, useEffect, useRef, useState } from 'react';
import api from '../../lib/api';

type MediaUploadType = 'PROFILE_IMAGE' | 'COVER_IMAGE' | 'GALLERY' | 'VIDEO_URL';

interface ImageUploadFieldProps {
  label: string;
  description: string;
  recommended: string;
  maxSizeMb: number;
  currentUrl?: string | null;
  mediaType?: MediaUploadType;
  schoolId?: string;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
  allowRemove?: boolean;
  allowUrlInput?: boolean;
  onChange: (url: string | null) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

function validUrl(value: string) {
  if (!value.trim()) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function ImageUploadField({
  label,
  description,
  recommended,
  maxSizeMb,
  currentUrl,
  mediaType = 'GALLERY',
  schoolId,
  minWidth,
  minHeight,
  aspectRatio,
  allowRemove = true,
  allowUrlInput = true,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState(currentUrl ?? '');

  useEffect(() => {
    setUrlDraft(currentUrl ?? '');
  }, [currentUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setWarning(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato no permitido. Usa JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`La imagen supera ${maxSizeMb} MB.`);
      event.target.value = '';
      return;
    }

    try {
      const dimensions = await getImageSize(file);
      const warnings: string[] = [];
      if (minWidth && dimensions.width < minWidth) warnings.push(`ancho menor a ${minWidth}px`);
      if (minHeight && dimensions.height < minHeight) warnings.push(`alto menor a ${minHeight}px`);
      if (aspectRatio) {
        const ratio = dimensions.width / dimensions.height;
        if (Math.abs(ratio - aspectRatio) > 0.12) warnings.push('proporción distinta a la recomendada');
      }
      setWarning(warnings.length ? `La imagen se subirá, pero tiene ${warnings.join(', ')}.` : null);

      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      form.append('type', mediaType);
      if (schoolId) form.append('schoolId', schoolId);

      const response = await api.post<{ ok: boolean; data: { url: string } }>('/media/upload', form);
      onChange(response.data.data.url);
      setUrlDraft(response.data.data.url);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function applyUrl() {
    if (!validUrl(urlDraft)) {
      setError('La URL debe empezar con http:// o https://.');
      return;
    }
    setError(null);
    onChange(urlDraft.trim() || null);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#006b2d] hover:bg-[#f6fef7] disabled:opacity-60 sm:w-48"
        >
          {currentUrl ? <img src={currentUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
          <span className={`relative rounded-xl px-3 py-2 text-xs font-semibold ${currentUrl ? 'bg-black/45 text-white' : 'text-slate-500'}`}>
            {uploading ? 'Subiendo...' : currentUrl ? 'Cambiar imagen' : 'Subir imagen'}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <div><dt className="font-semibold text-slate-700">Recomendado</dt><dd>{recommended}</dd></div>
            <div><dt className="font-semibold text-slate-700">Formato</dt><dd>JPG, PNG o WEBP</dd></div>
            <div><dt className="font-semibold text-slate-700">Máximo sugerido</dt><dd>{maxSizeMb} MB</dd></div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-[#006b2d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#005723] disabled:opacity-60"
            >
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
            </button>
            {allowRemove && currentUrl ? (
              <button
                type="button"
                onClick={() => {
                  setUrlDraft('');
                  onChange(null);
                }}
                className="rounded-full border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Quitar imagen
              </button>
            ) : null}
          </div>

          {allowUrlInput ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={urlDraft}
                onChange={(event) => setUrlDraft(event.target.value)}
                onBlur={applyUrl}
                placeholder="https://..."
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm focus:border-[#006b2d] focus:outline-none"
              />
              <button
                type="button"
                onClick={applyUrl}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Usar URL
              </button>
            </div>
          ) : null}

          {warning ? <p className="mt-3 text-xs text-amber-700">{warning}</p> : null}
          {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
